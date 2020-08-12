/*  @file       producer_meter.ino
*   @authors    Saurabh Gupta     [saurabh.gupta1002@gmail.com]
*               Awadhut Thube     [awadhutthube@gmail.com]
*               Jheel Nagaria     [nagariajheel@gmail.com]
*               Ashish Kamble     [ashishkamble14@gmail.com]
*/

/*
*   A 5V relays NC terminals are connected between the Producer's PV Emulator and the Battery Bank.
*   Under Normal Operation, the excess energy generated is stored in the batteries and
*   a DC meter in between records the enrgy transfer.
*
*   This Relay recieves commands from the Producer's Network Server Backend i.e. Producer.js
*   through serial port.
*
*   Upon recieving a value '1' from the server, this relay changes its state
*   and the battery stops charging. Original condition is restored upon recieving a value '2'.
*
*   We have set the default value to be Low, i.e. the PV emulator output charges the battery at
*   the start.
*/

int value = 2;

void setup() 
{
  Serial.begin(9600);
  pinMode(PD2,OUTPUT);
  digitalWrite(PD2,LOW); // Default Condition
}

void loop() 
{
  value = Serial.parseInt();  // Read the serial data

  if(value == 1)
  {
    // Toggle connection to stop charging the batteries
    digitalWrite(PD2,HIGH);
  } 

  if(value == 2)
  {
    // Go back to default state
    digitalWrite(PD2,LOW);
  }
}