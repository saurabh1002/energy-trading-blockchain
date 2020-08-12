/*  @file       comsumer.js
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
// Replace IP adress with that of the machine running the main server
var main_server = other_servers.connect('http://192.168.43.50:4000', {reconnect: true});

// Setup Serial Connection with Arduino Nano to control relay
// var SerialPort = require("serialport");
// var serialport = new SerialPort("/dev/cu.usbmodem1411",{parser: SerialPort.parsers.readline('\n')});
var SerialPort = require('serialport');
var Readline = SerialPort.parsers.Readline;
var arduino_serial_port = new SerialPort('/dev/cu.wchusbserial1410');
var parser = new Readline('\n');
arduino_serial_port.pipe(parser);

// // Serial Port Setup for Energy Meter Reading
// var serialPort = require('serialport');
// var meter_serial_port = new serialPort('/dev/cu.usbserial', {
//   baudRate: 115200,
//   parser: new serialPort.parsers.Readline('\n\r')
// });

// Variables Declaration
var producer_address; var consumer_address;
var ether_per_token = 0; var accepted_bid;
var accept_deal_flag = 0; var block_deal_flag = 1;
var pending_tx_list = []
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
var contract_address = "0xbccc53572694ea920a4bf3070b4780a7892855a2";
// Contract Object Creation at Contract Address
var obj = web3.eth.contract(abi).at("0xbccc53572694ea920a4bf3070b4780a7892855a2");

// Web3 setup
web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
web3.eth.defaultAccount = web3.eth.accounts[0];
web3Admin.extend(web3);

// Arduino Nano Serial Port
arduino_serial_port.on('open', function()
{
  console.log("Arduino Serial Port Open\n")
  main_server.on('connect', function(){  });

  //Close Connection
  main_server.on('close', function(data)
  {
    console.log("Closing Connection");
    arduino_serial_port.write('2');
    accept_deal_flag = 0;
    block_deal_flag = 1;
  });

  // Accept Bid
  // PoC - Active only for 1st Deal
  main_server.on('accept_deal_0', function(data)
  {
    producer_address = data.producer_address;
    consumer_address = data.consumer_address;
    accepted_bid = data.bid;
    // Toggle Relay Connection to connect the consumer to the battery
    if(consumer_address == web3.eth.accounts[0])
    {
      arduino_serial_port.write('1');
      accept_deal_flag = 1 ;
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

  // Wallet Functions
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
        // Get Account Balance
        var balance = web3.eth.getBalance(web3.eth.accounts[4]);
        socket.emit('pending_tx_list', {tx_1: pending_tx_list[0], tx_2: pending_tx_list[1], tx_3: pending_tx_list[2]});
        socket.emit('energy_token_balance',{bal:balance});
        // Get list of pending transactions
        pending_tx_list = web3.eth.getBlock("pending").transactions;
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
      console.log(producer);        // Print Producer account address
      console.log(consumer);        // Print Consumer account address
      console.log(ether_per_token); // Print Bid Value
      obj.send_eth(producer, ether_per_token, {from:consumer, to:contract_address, value:ether_per_token});
    }
  }, 8000);
});

// HTTP SERVER
http.listen(3000, function()
{
console.log('listening on *:3000');
});