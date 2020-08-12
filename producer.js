/*  @file       producer.js
*   @authors    Saurabh Gupta     [saurabh.gupta1002@gmail.com]
*               Awadhut Thube     [awadhutthube@gmail.com]
*               Jheel Nagaria     [nagariajheel@gmail.com]
*               Ashish Kamble     [ashishkamble14@gmail.com]
*/

// Instances //

/* web3.js is a collection of libraries that allow you to interact with a 
*  local or remote ethereum node using HTTP, IPC or WebSocket.
*/
var web3 = require('web3');
var Web3 = require('web3');
var web3 = new Web3();
var web3Admin = require('web3admin')

// Node.js web application framework
var express =  require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var other_servers = require('socket.io-client'); // This is a client connecting to the SERVER 2 (MAIN SERVER)
var main_server = other_servers.connect('http://localhost:4000', {reconnect: true});

// Setup Serial Connection with Arduino Nano to control relay
// var arduino_serial_port = require("serialport");
// var serialport = new SerialPort('/dev/cu.usbmodem1421',{parser: SerialPort.parsers.Readline('\n')});
var SerialPort = require('serialport');
var Readline = SerialPort.parsers.Readline;
var arduino_serial_port = new SerialPort('/dev/cu.usbmodem1421');
var parser = new Readline('\n');
arduino_serial_port.pipe(parser);

// Serial Port Setup for Energy Meter Reading
var serialPort = require('serialport');
var meter_serial_port = new serialPort('/dev/cu.usbserial', {
  baudRate: 115200,
  parser: new serialPort.parsers.Readline('\n\r')
});

// Variables Declaration
var meter_reading_string = ""; var value_meter;
var producer_address; var consumer_address;
var ether_per_token = 0; var accepted_bid;
var accept_deal_flag = 0; var block_deal_flag = 1;
var energy_tokens;
var pending_tx_list = []
var energy_KWH = 0; var prev_energy_KWH = 0; var difference = 0;
var producer; var consumer;

// Smart Contract for generation of Virtual Energy Tokens and Automate transactions
var abi = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_account",
        "type": "address"
      }
    ],
     "name": "token_balance",
     "outputs": [
       {
         "name": "",
         "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "balances",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_account",
          "type": "address"
        }
      ],
      "name": "eth_balance",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_account",
          "type": "address"
        },
        {"name": "amount",
        "type": "uint256"
      }
    ],
    "name": "send_eth",
    "outputs": [],
    "payable": true,
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_account",
        "type": "address"
      },
      {"name": "amount",
      "type": "uint256"
    }
  ],
  "name": "update_tokens",
  "outputs": [],
  "payable": false,
  "stateMutability": "nonpayable",
  "type": "function"
}
]
// Contract Address obtained after deploying contract from 'Remix Solidity Compiler'
// This is the token generation and ether sending contract
var contract_address = "0xbccc53572694ea920a4bf3070b4780a7892855a2" ;   
// Contract Object Creation at Contract Address
var obj = web3.eth.contract(abi).at("0xbccc53572694ea920a4bf3070b4780a7892855a2");

// Web3 setup
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
web3.eth.defaultAccount = web3.eth.accounts[0];
web3Admin.extend(web3);

// Energy Meter Serial Port
meter_serial_port.on('open', function()
{
  console.log("Energy Meter Serial Port Open\n")
  setInterval(function()
  {
    // Request to read energy consumption data from the meter
    meter_serial_port.write(Buffer.from('SHOW=\r\n'), function(error)
    {
      // Search for 'KWH'(Power consumption reading) in the data returned by the meter
      KWH_index = meter_reading_string.indexOf("KWH", 0);
      // Our required reading is at index 8 and 9 from the 'KWH' substring start index
      value_meter = meter_reading_string.substring(KWH_index + 8, KWH_index + 9);
      energy_KWH = 1 + Number(value_meter);
      // Reset String
      meter_reading_string = "";
      // Check for writing error
      if (error)
      {
        return console.log('Error on writing to Meter: ', error.message);
      }
    });
  }, 5000)
  // Read energy consumption data from the meter
  meter_serial_port.on('data', function (data)
  {
    meter_reading_string = meter_reading_string + data.toString();
  });
});

// Arduino Nano Serial Port
arduino_serial_port.on('open', function()
{
  console.log("Arduino Serial Port Open\n")
  main_server.on('connect', function(){  });

  //Close Connection
  main_server.on('close',function(data)
  {
    console.log("Closing Connection");
    arduino_serial_port.write('2');
    accept_deal_flag = 0;
    block_deal_flag = 1;
  });

  // Accept Bid
  // PoC - Active only for 1st Deal
  main_server.on('accept_deal_0',function(data)
  {
    producer_address = data.producer_address;
    consumer_address = data.consumer_address;
    accepted_bid = data.bid;
    // Toggle Relay Connection to stop producer from charging battery
    if(consumer_address == web3.eth.accounts[0])
    {
      arduino_serial_port.write('1');
      accept_deal_flag = 1 ;
    }
  });
  
  //Accept request for Sharing Energy Tokens of Producers for Display on Marketplace
  main_server.on('req_tokens_0', function(data)
  {
    if(data == web3.eth.accounts[4])
    {
      main_server.emit('display_tokens_0', energy_tokens);
    }
  });

  main_server.on('req_tokens_1', function(data)
  {
    if(data == web3.eth.accounts[4])
    {
      main_server.emit('display_tokens_1', energy_tokens);
    }
  });

  main_server.on('req_tokens_2', function(data)
  {
    if(data == web3.eth.accounts[4])
    {
      main_server.emit('display_tokens_2', energy_tokens);
    }
  });

  main_server.on('req_tokens_3', function(data)
  {
    if(data == web3.eth.accounts[4])
    {
      main_server.emit('display_tokens_3', energy_tokens);
    }
  });

  main_server.on('req_tokens_4', function(data)
  {
    if(data == web3.eth.accounts[4])
    {
      main_server.emit('display_tokens_4', energy_tokens);
    }
  });

  main_server.on('req_tokens_5', function(data)
  {
    if(data == web3.eth.accounts[4])
    {
      main_server.emit('display_tokens_5', energy_tokens);
    }
  });

  // Login to Personal Account using Passphrase
  app.use(express.static('public'));
  app.get('/', function(req, res)
  {
    res.sendfile('login_page.html');
    io.once('connection', function (socket)
    {
      socket.on('check_passphrase', function (data)
      {
        // Unlock Ethereum Account [0] and send its boolean output
        var unlock_result = web3.personal.unlockAccount(web3.eth.accounts[0], data, 100000);
        socket.emit('unlock_ethereum_account_result', unlock_result);
      });
    });
  });

  //Wallet Functions
  app.get('/enter_wallet', function(req, res)
  {
    res.sendfile('wallet.html');

    io.on('connection', function (socket)
    { 
      // Start Mining
      socket.on('startmine', function(socket)
      {
        var Mine = web3.miner.start();
      });
      // Stop Mining
      socket.on('stopmine', function(socket)
      {
        var StopMine = web3.miner.stop();
      });
      // Do a Basic Transaction
      socket.on('basic_tx', function(data)
      {
        from_address = web3.eth.accounts[0];
        to_address = data.add;
        value = data.val;
        var send = web3.eth.sendTransaction({from : from_address, to: to_address , value:value})
      });

      setInterval(function()
      {
        difference= energy_KWH - prev_energy_KWH;
        // Get Account Balance
        var balance = web3.eth.getBalance(web3.eth.accounts[4]);
        socket.emit('pending_tx_list', {tx_1:pending_tx_list[0], tx_2:pending_tx_list[1], tx_3:pending_tx_list[2]});
        socket.emit('energy_token_balance', {energy:energy_KWH, tok:energy_tokens, bal:balance});
        // If increment in Energy supplied to battery, increase energy tokens
        if(difference != 0)
        {
          obj.update_tokens(web3.eth.accounts[4], difference);
          prev_energy_KWH = energy_KWH;
        }
        // Get list of pending transactions
        pending_tx_list = web3.eth.getBlock("pending").transactions;
        // Get Token balance from Smart Contract Object
        energy_tokens = obj.token_balance.call(web3.eth.accounts[4]);
      }, 1000);
    });
  });

  // Check if a bid has been accepted
  // If yes, then register the account addresses and initiate realtime 
  // transactions through the smart contract
  setInterval(function()
  {
    if (accept_deal_flag == 1 && block_deal_flag == 1)
    {
      // Register account addresses and purchase value
      producer = producer_address;
      consumer = consumer_address;
      ether_per_token = accepted_bid;

      // Toggle flag
      block_deal_flag = 2;
    }
    if (accept_deal_flag == 1)
    {
      obj.send_eth(producer, ether_per_token, {from:consumer, to:contract_address, value:ether_per_token});
    }
  }, 8000);
});

// HTTP SERVER
http.listen(3000, function()
{
  console.log('listening on *:3000');
});