#include "HX711.h"
#include "averager.h"
#include "button.h"
#include "serialParser.h"
#include <EEPROM.h>

#define TEACH_BUTTON 64
#define SENSOR_DATA 32
#define REQUEST_DATA 48
#define CALIBRATION_WEIGHT 16
#define READY 127

#define DIGI_READ 1
#define ANA_READ 2
#define DIGI_WRITE 4
#define PWM_WRITE 8
#define DIGI_WATCH 16
#define ANA_REPORT 32

HX711 scales[3];
averager aves[3];
serialParser parser(Serial);
Button calBut;

long initRead[3];
int calibrationWeight = 25;

int pins[3][2] = {{9, 8}, {7,6}, {5,4}};
float factors[3] = {8800.f, 9000.f, 8200.f};

int eeAddress = 0;
int oldState = 0;

void sendData(char which){
  long value = aves[which].ave;
  parser.sendPacket(REPORT,
    SENSOR_DATA,
    which + 1,
    (value>>28)&127,
    (value>>21)&127,
    (value>>14)&127,
    (value>>7)&127,
    (value)&127);
}

void setup() {
  Serial.begin(115200);

  pinMode(13,OUTPUT);
  
  parser.address = 1;

  parser.on(REQUEST_DATA, [](unsigned char * input, int size){
    sendData(0);
    sendData(1);
    sendData(2);
  });

  parser.on(READY, [](unsigned char * input, int size){
    parser.sendPacket(REPORT,READY);
    digitalWrite(13,HIGH);
  });

  for(int i=0; i<3; i++){
    scales[i].begin(pins[i][0], pins[i][1]);
    //EEPROM.get( eeAddress + i * sizeof(float), factors[i] );
    scales[i].set_scale(factors[i]);
    initRead[i] = scales[i].read();
    scales[i].tare();
  }

  calBut.setup([](int state){
    parser.sendPacket(REPORT,TEACH_BUTTON, state);
  }, 10);

  parser.sendPacket(REPORT,READY);

}

unsigned long printTimer = 0;

void loop() {
  calBut.idle();

  double tot = 0;
  for(int i=0; i<3; i++){
    aves[i].idle(scales[i].read());
    tot+=aves[i].ave;
  }

  /*double xb = ((-.866 * aves[0].ave) + (0.866 * aves[1].ave) + (0 * aves[2].ave))/tot;
  double yb = ((.5 * aves[0].ave) + (.5 * aves[1].ave) + (-1 * aves[2].ave))/tot;
 
  double distance = sqrt(pow(xb, 2) + pow(yb, 2));*/

  parser.idle();
}
