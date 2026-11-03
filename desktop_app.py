"""Aplicación de escritorio del anfitrión: servidor LAN y juego en una ventana."""
import threading

import webview

import server


def main():
    httpd=server.start_server(open_browser=False,background=True)
    try:
        webview.create_window(
            "Ciudad Viva",
            f"http://127.0.0.1:{server.PORT}/",
            width=1440,
            height=940,
            min_size=(960,640),
            text_select=True,
        )
        webview.start(debug=False)
    finally:
        # Detener el servidor al cerrar la ventana integrada.
        stop=threading.Thread(target=httpd.shutdown,daemon=True,name="CiudadVivaShutdown")
        stop.start()
        stop.join(timeout=3)
        httpd.server_close()


if __name__=="__main__":
    main()
