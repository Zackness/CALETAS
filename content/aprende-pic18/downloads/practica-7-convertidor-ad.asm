;==============================================================================
; PRACTICA 7 — Convertidor analogico-digital (ADC 10 bits)
; Microcontrolador: PIC18F4550
; Curso: Microcontroladores — Ing. Mecatronica — UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware (segun diagrama UNEXPO):
;   Potenciometro -> AN0 / RA0
;   LCD 4 bit: datos RB0-RB3, RS -> RE0, E -> RE1
;
; Cristal 20 MHz: ADCS = 101 (16 Tosc) en ADCON2
;
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

        cblock 0x20
            adc_l
            adc_h
            lcd_tmp
            lcd_byte
            dly
            dig0
            dig1
            dig2
            dig3
        endc

        ORG     0x0000
        GOTO    inicio

;==============================================================================
inicio:
        MOVLW   0x0E                ; RA0 analogico, resto digital
        MOVWF   ADCON1
        MOVLW   B'10100010'         ; ADFM=1, ADCS=101
        MOVWF   ADCON2
        MOVLW   B'00000001'         ; canal AN0, ADON
        MOVWF   ADCON0

        BSF     TRISA, 0
        CLRF    TRISB
        BCF     TRISB, 0
        BCF     TRISB, 1
        BCF     TRISB, 2
        BCF     TRISB, 3
        CLRF    TRISE
        BCF     TRISE, 0
        BCF     TRISE, 1

        CALL    lcd_init
        MOVLW   0x80
        CALL    lcd_cmd
        MOVLW   'A'
        CALL    lcd_dat
        MOVLW   'D'
        CALL    lcd_dat
        MOVLW   'C'
        CALL    lcd_dat
        MOVLW   ':'
        CALL    lcd_dat

bucle:
        CALL    leer_adc
        CALL    mostrar_adc_lcd
        GOTO    bucle

;==============================================================================
leer_adc:
        BSF     ADCON0, GO
espera:
        BTFSC   ADCON0, GO
        GOTO    espera
        MOVF    ADRESL, W
        MOVWF   adc_l
        MOVF    ADRESH, W
        MOVWF   adc_h
        RETURN

mostrar_adc_lcd:
        ; Muestra valor 0-1023 (4 digitos simplificados en plantilla)
        MOVLW   0xC0
        CALL    lcd_cmd
        MOVF    adc_h, W
        CALL    nibble_a_ascii
        CALL    lcd_dat
        MOVF    adc_l, W
        CALL    byte_a_ascii2
        RETURN

nibble_a_ascii:
        ANDLW   0x0F
        ADDLW   '0'
        RETURN

byte_a_ascii2:
        MOVWF   lcd_tmp
        SWAPF   lcd_tmp, W
        CALL    nibble_a_ascii
        CALL    lcd_dat
        MOVF    lcd_tmp, W
        CALL    nibble_a_ascii
        CALL    lcd_dat
        RETURN

;==============================================================================
; LCD 4 bit en RB0-RB3, RS=RE0, E=RE1
;==============================================================================
lcd_init:
        CALL    retardo_largo
        MOVLW   0x03
        CALL    lcd_nibble
        MOVLW   0x03
        CALL    lcd_nibble
        MOVLW   0x03
        CALL    lcd_nibble
        MOVLW   0x02
        CALL    lcd_nibble
        MOVLW   0x28
        CALL    lcd_cmd
        MOVLW   0x0C
        CALL    lcd_cmd
        MOVLW   0x01
        CALL    lcd_cmd
        RETURN

lcd_cmd:
        BCF     LATE, 0
        GOTO    lcd_write

lcd_dat:
        BSF     LATE, 0

lcd_write:
        MOVWF   lcd_byte
        SWAPF   lcd_byte, W
        CALL    lcd_nibble
        MOVF    lcd_byte, W
        CALL    lcd_nibble
        RETURN

lcd_nibble:
        ANDLW   0x0F
        MOVWF   lcd_tmp
        MOVF    lcd_tmp, W
        MOVWF   LATB
        BSF     LATE, 1
        CALL    retardo_corto
        BCF     LATE, 1
        RETURN

retardo_corto:
        MOVLW   0x20
        MOVWF   dly
        DECFSZ  dly, F
        GOTO    retardo_corto
        RETURN

retardo_largo:
        MOVLW   0x10
        MOVWF   dig0
rl:
        CALL    retardo_corto
        DECFSZ  dig0, F
        GOTO    rl
        RETURN

        END
