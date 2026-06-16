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
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

        cblock 0x20
            modo
            oper_a
            oper_b
            resto           ; dividendo restante en division software
            cociente
            btn_prev
        endc

#define MODO_MAX        8

        ORG     0x0000
        GOTO    inicio

;==============================================================================
inicio:
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

bucle_principal:
        CALL    leer_operandos
        CALL    ejecutar_modo
        CALL    mostrar_resultado
        CALL    revisar_pulsador
        GOTO    bucle_principal

;==============================================================================
leer_operandos:
        MOVF    PORTB, W
        MOVWF   oper_a
        MOVF    PORTD, W
        MOVWF   oper_b
        RETURN

;==============================================================================
; Tabla de saltos por modo (0..8)
;==============================================================================
ejecutar_modo:
        MOVF    modo, W
        BTFSC   STATUS, Z
        GOTO    op_suma
        MOVF    modo, W
        XORLW   1
        BTFSC   STATUS, Z
        GOTO    op_resta
        MOVF    modo, W
        XORLW   2
        BTFSC   STATUS, Z
        GOTO    op_mul
        MOVF    modo, W
        XORLW   3
        BTFSC   STATUS, Z
        GOTO    op_div
        MOVF    modo, W
        XORLW   4
        BTFSC   STATUS, Z
        GOTO    op_or
        MOVF    modo, W
        XORLW   5
        BTFSC   STATUS, Z
        GOTO    op_and
        MOVF    modo, W
        XORLW   6
        BTFSC   STATUS, Z
        GOTO    op_xor
        MOVF    modo, W
        XORLW   7
        BTFSC   STATUS, Z
        GOTO    op_compl
        GOTO    op_rot

op_suma:
        MOVF    oper_b, W
        ADDWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_resta:
        MOVF    oper_a, W
        SUBWF   oper_b, W         ; W = oper_a - oper_b
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_mul:
        MOVF    oper_b, W
        MULWF   oper_a            ; PRODH:PRODL = A * B
        RETURN

op_div:
        CALL    division_software
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_or:
        MOVF    oper_b, W
        IORWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_and:
        MOVF    oper_b, W
        ANDWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_xor:
        MOVF    oper_b, W
        XORWF   oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_compl:
        COMF    oper_a, W
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

op_rot:
        MOVF    oper_a, W
        RLNCF   WREG, W           ; rotacion izquierda sin acarreo
        CLRF    PRODH
        MOVWF   PRODL
        RETURN

;==============================================================================
; oper_a / oper_b -> WREG (cociente). Divisor 0 -> 0xFF
; Algoritmo: restas repetidas (division por software)
;==============================================================================
division_software:
        MOVF    oper_b, W
        BZ      div_error
        CLRF    cociente
        MOVF    oper_a, W
        MOVWF   resto
div_loop:
        MOVF    resto, W
        SUBWF   oper_b, W         ; W = resto - oper_b
        BTFSS   STATUS, C
        GOTO    div_fin
        MOVF    oper_b, W
        COMF    WREG, W
        ADDLW   1                 ; W = -oper_b
        ADDWF   resto, F          ; resto = resto - oper_b
        INCF    cociente, F
        GOTO    div_loop
div_fin:
        MOVF    cociente, W
        RETURN
div_error:
        MOVLW   0xFF
        RETURN

;==============================================================================
mostrar_resultado:
        MOVF    PRODL, W
        MOVWF   LATC
        MOVF    PRODH, W
        MOVWF   LATE
        RETURN

;==============================================================================
; Flanco de bajada en RA0 (pulsador con pull-up interno/externo)
;==============================================================================
revisar_pulsador:
        BTFSC   PORTA, 0          ; 1 = pulsador suelto (pull-up)
        GOTO    btn_liberado
        BTFSC   btn_prev, 0       ; ya se conto este pulso
        RETURN
        BCF     btn_prev, 0
        INCF    modo, F
        MOVF    modo, W
        SUBLW   MODO_MAX + 1
        BTFSC   STATUS, Z
        CLRF    modo
        RETURN
btn_liberado:
        BSF     btn_prev, 0
        RETURN

        END
