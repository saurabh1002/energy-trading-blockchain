# Software Installation and Startup Guide
- [Software Installation and Startup Guide](#software-installation-and-startup-guide)<br>
      - [1. Node.js](#1-nodejs)<br>
      - [2. Ethereum Blockchain Client (Command Line Interface)](#2-ethereum-blockchain-client-command-line-interface)<br>
      - [3. DC Energy Meter Drivers](#3-dc-energy-meter-drivers)<br>
      - [4. Arduino IDE](#4-arduino-ide)<br>
      - [5. Smart Contract Deployment](#5-smart-contract-deployment)<br>
  
#### 1. Node.js
Download *Node.js* for your respective Operating System from [here](https://nodejs.org/en/download/). (This project requires [Node.js](https://nodejs.org/) v6+ to run.)
Open your favorite Terminal and run these commands.
1. Check Node version.
    ```sh
    $ node -v
    ```
2. Check Node Package Manager Version.
    ```sh
    $ npm -v
    ```
3. Now that you have Node set up on your machine, you need some extra Node Modules installed before you move ahead to install the Blockchain Client.
    ```sh
    $ npm install express --save
    $ npm install socket.io --save
    $ npm install web3 --save
    $ npm install web3admin --save
    ```
#### 2. Ethereum Blockchain Client (Command Line Interface)

Open a terminal from within the cloned package directory and run the following commands.
1. Geth Installation (Go-Ethereum)
    For Ubuntu
    ```sh
    $ tar -xvf Softwares/Ethereum_Go_Lang/geth-linux-amd64-1.5.8-f58fb322.tar.gz
    $ mv geth-linux-amd64-1.5.8-f58fb322 Geth
    ```
    For MacOS
    ```sh
    $ tar -xvf Softwares/Ethereum_Go_Lang/geth-alltools-darwin-amd64-1.5.8-f58fb322.tar.gz
    $ mv geth-alltools-darwin-amd64-1.5.8-f58fb322 Geth
    ```
2. Geth Initialization
    Create a Private Network with a custom genesis block provided to you.<br>
    This command will output "*Successfully wrote genesis block*"  on the console.
    ```sh
    $ ./Geth/geth init genesis.json 
    ```
    To start the geth CLI console enter the following command.
    ```sh
    $ ./Geth/geth --rpc --rpcapi="eth,web3,miner,net,personal" --rpcaddr="localhost" --rpcport="8545" --rpccorsdomain="*" console
    ```
    Now you will have entered the ethereum console, where you can type geth commands on lines that start with this:
    ```
    >
    ```

3. Geth Basic Commands
    The following commands can be given to the ethereum console.
    a. Create a new account (Remember the passphrase of each new account created along with its hexadecimal address).
    ```Go
    > personal.newAccount("your_passphrase")
    [output] "0x........................................"
    ```
    b. Show all account addresses
    ```Go
    > eth.accounts
    [output] ["0x........................................"]
    ```
    c. Show a particular account address
    ```Go
    > eth.accounts[0]
    [output] "0x........................................"
    ```
    d. Check account balance in Ether
    ```Go
    > eth.getBalance(eth.accounts[0])
    [output] 0
    ```
    e. Make transaction from one account to another. Enter the correct passphrase to unlock the account from which you are sending Ether.
    ```Go
    > personal.unlockAccount(eth.accounts[0])
    [output] passphrase: Type Passphrase here
    [output] 'True' / 'False'
    > eth.sendTransaction({from: eth.accounts[0], to: eth.accounts[1], value: 1234})
    [output] Transaction ID
    ```
    f. Mining operations
    ```Go
    > miner.start()
    [output] "Mined potential block with 'x' transactions"
    > miner.stop()
    ```
    g. Retrieve blockchain personal node information
    ```Go
    > admin.nodeInfo
    [output] coinbase
    [output] enode
    [output] block number
    [output] difficulty
    ```
    h. Exit console
    ```Go
    > exit
    ```
4. Connecting two users on the same private network
Ensure that both the users are on the same local network and are initialized with the same *genesis.json* file.<br>
Exchange the enode data of both users from the `admin.nodeInfo` command output.<br>
Add a peer using the exchanged enodes by the following command.
    ```Go
    > admin.addPeer("enode://other_users_enode_hex@other_users_ip_address:30303")
    [output] 'True' / 'False'
    > net.peerCount
    [output] 1 if both are connected successfully else 0
    ```
    Once connected, you will see `Block Syncronization Started` on console.

5. Allocate Ether to your accounts in `genesis.json` file. <br>By default, every account created in the private network has zero balance. To generate Ether, one needs to mine for long period of time or else, one can edit the `genesis.json` file to allocate a starting balance to any account id.

    To allocate a starting balance, add the following lines in the [genesis.json](genesis.json) file.
    ```
    "alloc":
        {
            "Account_address_in_hexadecimal": {"balance" : "Enter_value_in_Ether"},
            "Account_address_in_hexadecimal": {"balance" : "Enter_value_in_Ether"},
            "Account_address_in_hexadecimal": {"balance" : "Enter_value_in_Ether"}
        }
    ```
    Save this edited file. 
    Now re-initialize the geth node with this edited genesis data using the same command as mentioned previously.

    **Remeber that when connecting multiple users on same blockchain network, all users need to initialize their geth node with the same `genesis.json` file.**


#### 3. DC Energy Meter Drivers
* Install the USB Serial port drivers for retrieving data from the [Everon DC Energy Meters](https://www.everon.in/solar-energy-meter-data-logger.html).

* **.exe** installation files are provided in the `Softwares/DC_Energy_Meter/` folder in compressed format.

* Any RS232 serial port driver will work in case .exe files are not supported on your OS.

#### 4. Arduino IDE
* Install the suitable version of Arduino IDE for your OS from [here](https://www.arduino.cc/en/main/software).

* This is required to program and control the custom made relay circuit using [Arduino Nano](https://store.arduino.cc/usa/arduino-nano) fitted inside the energy meter to control the conn

#### 5. Smart Contract Deployment
* Read [this](SMART_CONTRACT.md) to learn how to deploy a smart contract on your private network.