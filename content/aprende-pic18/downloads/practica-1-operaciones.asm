;==============================================================================
; PRACTICA 1 — Sistema minimo, puertos y operaciones matematicas
; Microcontrolador: PIC18F4550
; Curso: Microcontroladores — Ing. Mecatronica — UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware (segun diagrama de la practica):
;   PORTB  -> operando A (DIP switch, 8 bits)
;   PORTD  -> operando B (DIP switch, 8 bits)
;   LATC   -> resultado bits 0-7 (LEDs)
;   LATE   -> resultado bits 8-15 (LEDs, multiplicacion)
;   RA0    -> pulsador NA para cambiar de operacion
;
; Operaciones (pulsar RA0 para avanzar):
;   0 Suma  1 Resta  2 Multiplicacion  3 Division (software)
;   4 OR    5 AND    6 XOR             7 Complemento  8 Rotar izq. sin acarreo
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
            modo
            oper_a
            oper_b
            resto           ; dividendo restante en division software
            cociente
            btn_prev
        ENDC

#define MODO_MAX        8

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
        MOVLW   0x0F
        MOVWF   ADCON1            ; pines RA/RE digitales

        CLRF    LATC
        CLRF    LATE
        CLRF    modo
        BSF     btn_prev, 0

        MOVLW   0xFF
        MOVWF   TRISB             ; operandos A
        MOVWF   TRISD             ; operandos B
        BSF     TRISA, 0          ; RA0 entrada (pulsador)

        CLRF    TRISC             ; LEDs resultado bajo
        CLRF    TRISE             ; LEDs resultado alto

BUCLE_PRINCIPAL
        CALL    LEER_OPERANDOS
        CALL    EJECUTAR_MODO
        CALL    MOSTRAR_RESULTADO
        CALL    REVISAR_PULSADOR
        GOTO    BUCLE_PRINCIPAL

;==============================================================================
; SUBRUTINAS
;==============================================================================

LEER_OPERANDOS
        MOVF    PORTB, W
        MOVWF   oper_a
        MOVF    PORTD, W
        MOVWF   oper_b
        RETURN

; Tabla de saltos por modo (0..8)
EJECUTAR_MODO
        MOVF    modo, W
        BTFSC   STATUS, Z
        GOTO    OP_SUMA
        MOVF    modo, W
        XORLW   1
        BTFSC   STATUS, Z
        GOTO    OP_RESTA
        MOVF    modo, W
        XORLW   2
        BTFSC   STATUS, Z
        GOTO    OP_MUL
        MOVF    modo, W
        XORLW   3
        BTFSC   STATUS, Z
        GOTO    OP_DIV
        MOVF    modo, W
        XORLW   4
        BTFSC   STATUS, Z
        GOTO    OP_OR
        MOVF    modo, W
        XORLW   5
        BTFSC   STATUS, Z
        GOTO    OP_AND
        MOVF    modo, W
        XORLW   6
        BTFSC   STATUS, Z
        GOTO    OP_XOR
        MOVF    modo, W
        XORLW   7
        BTFSC   STATUS, Z
        GOTO    OP_COMPL
        GOTO    OP_ROT

OP_SUMA
        MOVF    oper_b, W
        ADDWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_RESTA
        MOVF    oper_a, W
        SUBWF   oper_b, W         ; W = oper_a - oper_b
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_MUL
        MOVF    oper_b, W
        MULWF   oper_a            ; PRODH:PRODL = A * B
        RETURN

OP_DIV
        CALL    DIVISION_SOFTWARE
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_OR
        MOVF    oper_b, W
        IORWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_AND
        MOVF    oper_b, W
        ANDWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_XOR
        MOVF    oper_b, W
        XORWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_COMPL
        COMF    oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

OP_ROT
        MOVF    oper_a, W
        RLNCF   WREG, W           ; rotacion izquierda sin acarreo
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

; oper_a / oper_b -> WREG (cociente). Divisor 0 -> 0xFF
; Algoritmo: restas repetidas (division por software)
DIVISION_SOFTWARE
        MOVF    oper_b, W
        BZ      DIV_ERROR
        CLRF    cociente
        MOVF    oper_a, W
        MOVWF   resto
DIV_LOOP
        MOVF    resto, W
        SUBWF   oper_b, W         ; W = resto - oper_b
        BTFSS   STATUS, C
        GOTO    DIV_FIN
        MOVF    oper_b, W
        COMF    WREG, W
        ADDLW   1                 ; W = -oper_b
        ADDWF   resto, F          ; resto = resto - oper_b
        INCF    cociente, F
        GOTO    DIV_LOOP
DIV_FIN
        MOVF    cociente, W
        RETURN
DIV_ERROR
        MOVLW   0xFF
        RETURN

MOSTRAR_RESULTADO
        MOVF    PRODL, W
        MOVWF   LATC
        MOVF    PRODH, W
        MOVWF   LATE
        RETURN

; Flanco de bajada en RA0 (pulsador con pull-up interno/externo)
REVISAR_PULSADOR
        BTFSC   PORTA, 0          ; 1 = pulsador suelto (pull-up)
        GOTO    BTN_LIBERADO
        BTFSC   btn_prev, 0       ; ya se conto este pulso
        RETURN
        BCF     btn_prev, 0
        INCF    modo, F
        MOVF    modo, W
        SUBLW   MODO_MAX + 1
        BTFSC   STATUS, Z
        CLRF    modo
        RETURN
BTN_LIBERADO
        BSF     btn_prev, 0
        RETURN

;==============================================================================
; RUTINAS DE INTERRUPCION
;==============================================================================

ISR_VACIA
        RETFIE

        END
