# VLC Redesign: skin para VLC 3

Skin para **VLC 3.0** (interfaz Skins2) que implementa el rediseño de VLC creado por **[Juxtopposed](https://www.figma.com/@juxtopposed)**.

![Reproductor con la skin](docs/screenshots/player.png)

## Créditos del diseño

El diseño original **no es mío**. Es obra de **Juxtopposed** y está publicado en la comunidad de Figma:

- **Diseño:** [VLC Redesign, por Juxtopposed](https://www.figma.com/community/file/1691465999134370980/vlc-redesign)
- **Video donde se presentó el rediseño:** https://youtu.be/ERFeOgqk324
- **Licencia del diseño:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Este repositorio solo **implementa ese diseño** como una skin que se puede usar hoy en VLC 3. Todo el mérito visual (colores, tipografía, iconografía y distribución) es de Juxtopposed. Aquí solo se tradujo el Figma a una skin funcional, lo más fiel posible: los colores, medidas e íconos se extrajeron directamente del archivo de Figma.

## Capturas

| Barra lateral y cola | Cola |
|---|---|
| ![Barra lateral y cola](docs/screenshots/sidebar-queue.png) | ![Cola](docs/screenshots/queue.png) |

| Sin reproducción |
|---|
| ![Reproductor en reposo](docs/screenshots/idle.png) |

## Instalación

1. Descarga [`VLCRedesign.vlt`](https://github.com/SrPio/vlc-redesign-skin/releases/latest/download/VLCRedesign.vlt) (también está en [`dist/`](dist/)).
2. Cópialo en la carpeta de skins de VLC:
   - Windows: `%APPDATA%\vlc\skins\`
   - Linux: `~/.local/share/vlc/skins2/`
3. En VLC ve a **Herramientas → Preferencias → Interfaz**, marca **Usar skin personalizado** y elige `VLCRedesign.vlt`.
4. Reinicia VLC.

Para volver a la interfaz normal, elige **Usar estilo nativo** en esa misma pantalla.

> Probado en VLC 3.0.23 para Windows. Skins2 no está disponible en macOS.

## Qué incluye

- **Barra superior:** menú (⋯), botón de barra lateral, acceso a carpeta, título del archivo en reproducción y botones de ventana. Se puede arrastrar desde toda la barra.
- **Barra de controles:** play/pausa, barra de progreso, volumen en forma de cuña con degradado, menús de audio, video/subtítulos y reproducción, y botón de cola.
- **Barra lateral:** rail de íconos (abrir archivo, carpeta, disco, red, lista y más) y un panel con el árbol de la lista de reproducción y la biblioteca.
- **Panel de cola:** lista de reproducción con ordenar, repetir, aleatorio, quitar y añadir.
- **Pantalla completa:** barra de controles inferior.
- La ventana se redimensiona desde el borde derecho, el borde inferior y la esquina inferior derecha.

## Limitaciones

Skins2, el sistema de skins de VLC 3, tiene límites que impiden replicar algunas partes del diseño:

- Los diálogos (onboarding, "Customize Player", configuración, etc.) son ventanas nativas de VLC y una skin no puede cambiarlos.
- Las listas no muestran miniaturas ni duraciones, ni el contador "4 items - 2h 3m".
- Las pestañas Bookmarks y Chapters son solo visuales.
- El video es una ventana nativa, así que el panel de cola va al lado del video y no flotando encima.
- La ventana solo se puede redimensionar desde la derecha y desde abajo.
- "Create playlist" aparece como "Add media", porque VLC 3 no maneja listas vacías.

## Contribuir

Este proyecto es **de código abierto** y cualquier mejora es bienvenida: ajustes de fidelidad con el diseño, correcciones, soporte para otras plataformas, traducciones de los tooltips, etc. Abre un *issue* o envía un *pull request*.

### Compilar desde el código

Requiere [Node.js](https://nodejs.org) y [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm run build
```

Esto genera `dist/VLCRedesign.vlt`. Estructura del proyecto:

| Ruta | Contenido |
|---|---|
| `tools/spec.mjs` | Colores, medidas y tokens tomados del Figma |
| `tools/build-font.mjs` | Variante de Inter con métricas ajustadas para centrar el texto de las listas |
| `tools/build-assets.mjs` | Genera todas las imágenes de la skin en `skin/images/` |
| `tools/build-theme.mjs` | Genera `skin/theme.xml` (las 4 distribuciones de ventana y el controlador de pantalla completa) |
| `tools/pack.mjs` | Empaqueta `skin/` en el `.vlt` |
| `tools/figma-export.mjs` | Vuelve a exportar íconos y renders desde Figma (opcional) |
| `design/icons`, `design/reference` | Íconos SVG y renders exportados del diseño de Juxtopposed |

Para volver a exportar desde Figma, duplica el [archivo de la comunidad](https://www.figma.com/community/file/1691465999134370980/vlc-redesign) en tu cuenta y ejecuta:

```bash
FIGMA_TOKEN=<tu token personal> FIGMA_FILE_KEY=<clave de tu copia> pnpm run figma
```

## Licencia

- **Código:** [MIT](LICENSE).
- **Diseño, íconos y renders** (`design/`): © Juxtopposed, bajo [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- **Fuente Inter:** [SIL Open Font License 1.1](skin/fonts/Inter-LICENSE.txt).

VLC y el cono de VLC son marcas de VideoLAN. Este proyecto no está afiliado ni respaldado por VideoLAN.

---

## English

A **VLC 3** skin (Skins2) that implements the [VLC Redesign by Juxtopposed](https://www.figma.com/community/file/1691465999134370980/vlc-redesign) ([video](https://youtu.be/ERFeOgqk324), CC BY 4.0). The design belongs entirely to Juxtopposed; this repo only turns the Figma file into a working skin. Download [`VLCRedesign.vlt`](https://github.com/SrPio/vlc-redesign-skin/releases/latest/download/VLCRedesign.vlt), put it in your VLC skins folder and select it under *Tools → Preferences → Interface → Use custom skin*. It's open source, and contributions are welcome.
