@echo off

REM Definir las rutas de origen y destino
set "currentDir=%~dp0"
set "origen=%currentDir%dist\chatbot-webview\browser"
set "destino=%currentDir%..\test-kr4ken-extension"

REM Ejecutar NPM RUN BUILD
echo Ejecutando npm run build...
call npm run build

REM Comprobar si el directorio de origen existe
if exist "%origen%" (
    REM Comprobar si el directorio de destino existe
    if exist "%destino%" (
        REM Eliminar la carpeta de destino si ya existe
        echo Moviendo carpeta...
        rmdir /S /Q "%destino%\browser"
        
        REM Mover la carpeta de origen a destino
        move "%origen%" "%destino%"
        echo La carpeta se ha movido correctamente...

        REM Cambiar ubicación y ejecutar npm run compile
        cd /d "%destino%"
        echo Compilando la extension...
        call npm run compile || (
            echo Error al compilar.
            exit /b 1
        )

        REM Regresar a la ubicación original
        cd /d %currentDir%
    ) else (
        echo El directorio de destino no existe.
    )
) else (
    echo El directorio de origen no existe.
)
