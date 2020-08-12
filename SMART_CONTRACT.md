# Smart Contract Deployment Guide

1. ## Generating Smart Contract ABI
    1. Open the [contract.sol](contract.sol) file with the Solidity Online Compiler [Remix](http://remix.ethereum.org/#optimize=false&evmVersion=null&version=soljson-v0.4.11+commit.68ef5810.js) 
   
    2. Select the ***'Solidity Compiler'*** menu on the left pane of the online compiler.

    3. Select Compiler Version to be **0.4.11** and click on the ***'Compile contract.sol'*** button.
   
    4. Now, copy the contract **ABI** generated, provided at the bottom right of the left pane.

    5. This ABI has to be inserted in place of the `var abi` in the smart contract section of [producer.js](producer.js) and [consumer.js](consumer.js).

2. ## Deploying the Smart Contract to your private network
    ##### (Complete the steps mentioned in [INSTALL.md](INSTALL.md) before implementing this section.)
    1. Open the ethereum private console and unlock your first account with starting balance allocated through [genesis.json](genesis.json).
        ```sh
        $ ./Geth/geth --rpc --rpcapi="eth,web3,miner,net,personal" --rpcaddr="localhost" --rpcport="8545" --rpccorsdomain="*" console
        > personal.unlockAccount(eth.accounts[0])
        [output] Unlock account 0x........................................
        [output] Passphrase: Enter your account passphrase here
        [output] true
        ```
    
    2. Select the ***'Deploy & run transactions'*** menu on the left pane of the online compiler.
   
    3. Select the **Environment** to be **Web3 Provider** and click **Ok** on the pop-up window. (Make sure the geth node is running and account is unlocked.)

    4. Select the account you unlocked in step 1 from the ***ACCOUNT*** drop down menu.

    5. Click on ***Deploy***

    6. You will see something like the following on your geth console:
        ```sh
        > I0812 18:03:26.415128 internal/ethapi/api.go:1074] Tx(0x........................................) created: 0x........................................
        ```
    7. Copy the hex value after the string **'created:'** from the output on your geth console. This is the hex address of the deployed contract.
   
    8. This address has to be inserted in place of the `var contract_address = "0x....."` and `var obj = web3.eth.contract(abi).at("0x....")` in the smart contract section of [producer.js](producer.js) and [consumer.js](consumer.js).
   
    9.  Now start mining to mine the smart contract creation block. You will immediately see the block with transaction id of your contract being mined and added to your private chain.
        ```sh
        > miner.start()
        ```
    10. Stop Mining
        ```sh
        > miner.stop()
        ```