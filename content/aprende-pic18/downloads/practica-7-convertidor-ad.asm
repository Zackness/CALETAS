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
; Estructura sandwich:
;   Vectores -> Programa principal -> Subrutinas -> Fin
;
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

;==============================================================================
; CONFIGURACION
;==============================================================================

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

;==============================================================================
; VARIABLES
;==============================================================================

        CBLOCK  0x20
            adc_l
            adc_h
            lcd_tmp
            lcd_byte
            dly
            dig0
            dig1
            dig2
            dig3
        ENDC

;==============================================================================
; VECTORES
;==============================================================================

        ORG     0x0000
        GOTO    INICIO

        ORG     0x0008
        GOTO    ISR_VACIA

        ORG     0x0018
        RETFIE

;==============================================================================
; PROGRAMA PRINCIPAL
;==============================================================================

INICIO
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

        CALL    LCD_INIT
        MOVLW   0x80
        CALL    LCD_CMD
        MOVLW   'A'
        CALL    LCD_DAT
        MOVLW   'D'
        CALL    LCD_DAT
        MOVLW   'C'
        CALL    LCD_DAT
        MOVLW   ':'
        CALL    LCD_DAT

BUCLE_PRINCIPAL
        CALL    LEER_ADC
        CALL    MOSTRAR_ADC_LCD
        GOTO    BUCLE_PRINCIPAL

;==============================================================================
; SUBRUTINAS
;==============================================================================

LEER_ADC
        BSF     ADCON0, GO
ESPERA_ADC
        BTFSC   ADCON0, GO
        GOTO    ESPERA_ADC
        MOVF    ADRESL, W
        MOVWF   adc_l
        MOVF    ADRESH, W
        MOVWF   adc_h
        RETURN

MOSTRAR_ADC_LCD
        MOVLW   0xC0
        CALL    LCD_CMD
        MOVF    adc_h, W
        CALL    NIBBLE_A_ASCII
        CALL    LCD_DAT
        MOVF    adc_l, W
        CALL    BYTE_A_ASCII2
        RETURN

NIBBLE_A_ASCII
        ANDLW   0x0F
        ADDLW   '0'
        RETURN

BYTE_A_ASCII2
        MOVWF   lcd_tmp
        SWAPF   lcd_tmp, W
        CALL    NIBBLE_A_ASCII
        CALL    LCD_DAT
        MOVF    lcd_tmp, W
        CALL    NIBBLE_A_ASCII
        CALL    LCD_DAT
        RETURN

; LCD 4 bit en RB0-RB3, RS=RE0, E=RE1
LCD_INIT
        CALL    RETARDO_LARGO
        MOVLW   0x03
        CALL    LCD_NIBBLE
        MOVLW   0x03
        CALL    LCD_NIBBLE
        MOVLW   0x03
        CALL    LCD_NIBBLE
        MOVLW   0x02
        CALL    LCD_NIBBLE
        MOVLW   0x28
        CALL    LCD_CMD
        MOVLW   0x0C
        CALL    LCD_CMD
        MOVLW   0x01
        CALL    LCD_CMD
        RETURN

LCD_CMD
        BCF     LATE, 0
        GOTO    LCD_WRITE

LCD_DAT
        BSF     LATE, 0

LCD_WRITE
        MOVWF   lcd_byte
        SWAPF   lcd_byte, W
        CALL    LCD_NIBBLE
        MOVF    lcd_byte, W
        CALL    LCD_NIBBLE
        RETURN

LCD_NIBBLE
        ANDLW   0x0F
        MOVWF   lcd_tmp
        MOVF    lcd_tmp, W
        MOVWF   LATB
        BSF     LATE, 1
        CALL    RETARDO_CORTO
        BCF     LATE, 1
        RETURN

RETARDO_CORTO
        MOVLW   0x20
        MOVWF   dly
        DECFSZ  dly, F
        GOTO    RETARDO_CORTO
        RETURN

RETARDO_LARGO
        MOVLW   0x10
        MOVWF   dig0
RL
        CALL    RETARDO_CORTO
        DECFSZ  dig0, F
        GOTO    RL
        RETURN

;==============================================================================
; RUTINAS DE INTERRUPCION
;==============================================================================

ISR_VACIA
        RETFIE

        END
