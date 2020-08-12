/*  @file       contract.txt
*   @authors    Saurabh Gupta     [saurabh.gupta1002@gmail.com]
*               Awadhut Thube     [awadhutthube@gmail.com]
*               Jheel Nagaria     [nagariajheel@gmail.com]
*               Ashish Kamble     [ashishkamble14@gmail.com]
*/


pragma solidity ^0.4.11;

contract Test {
   mapping (address => uint) public balances;
   
   // Increment Energy Tokens in given account
   function update_tokens(address _account, uint amount) {
       balances[_account] = balances[_account] + amount;
       }
    
    // Return Energy Token Balance in given account
    function token_balance(address _account) returns (uint) {
        return balances[_account];
        }

    // Return Ether Balance in given account
    function eth_balance(address _account) constant returns (uint) {
        return _account.balance;
        }

    // Interface for automated payment
    // Decrements Energy Tokens in given account
    function send_eth(address _account,uint amount) payable {
        if(balances[_account] - amount < balances[_account]) {
            balances[_account] = balances[_account] - amount ;
            _account.transfer(amount);
            }
        else {
            _account.transfer(balances[_account]);
            balances[_account] = 0;
            }
        }
    }

