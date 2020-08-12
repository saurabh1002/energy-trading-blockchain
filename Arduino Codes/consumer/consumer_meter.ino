/*  @file       comsumer_meter.ino
*   @authors    Saurabh Gupta     [saurabh.gupta1002@gmail.com]
*               Awadhut Thube     [awadhutthube@gmail.com]
*               Jheel Nagaria     [nagariajheel@gmail.com]
*               Ashish Kamble     [ashishkamble14@gmail.com]
*/

/*
*   A 5V relays NC terminals are connected between the Consumer's Programmable Load and the Battery Bank.
*   Upon aceeptance of bid for energy purchase from producer, the consumer draws energy from the batteries and
*   a DC meter in between records the enrgy purchased.
*
*   This Relay recieves commands from the Consumer's Network Server Backend i.e. Consumer.js
*   through serial port.
*
*   Upon recieving a value '1' from the server, this relay changes its state and the battery
*   is connected with the consumer's load. Original condition is restored upon recieving a value '2'.
*
*   We have set the default value to be High, i.e. the  circuit between the Consumer and the batteries is open at
*   the start.
*/

int value = 2;

void setup() 
{
  Serial.begin(9600);
  pinMode(PD2,OUTPUT);
  digitalWrite(PD2,HIGH); // Default Condition
}

void loop() 
{
    value = Serial.parseInt();  // Read the serial data

    if(value == 1)
    { 
      // Toggle connection to draw energy from the batteries
      digitalWrite(PD2,LOW);
    }
    
    if(value == 2)
    {
      // Go back to default state
      digitalWrite(PD2,HIGH);
    } 
}