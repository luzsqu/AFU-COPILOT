# 🎬 Guión de Demo — AFU-COPILOT
**Duración estimada:** 3 min 30 seg  
**Formato:** Grabación de pantalla + narración en voz  
**Objetivo:** LinkedIn / presentación de producto

---

## ✅ Preparación antes de grabar

### Datos que necesitás tener listos
- [ ] Usuario creado: `luz` / contraseña: `luz123` (o la que usés)
- [ ] Proyecto activo: **"App Logística"** con al menos 5 historias
- [ ] Al menos 1 historia con criterios Gherkin y test cases completos
- [ ] Una imagen de mockup lista para subir (screenshot de Figma, wireframe, etc.)
- [ ] Jira configurado en ⚙ Configuración (si vas a mostrar esa parte)
- [ ] Dark mode: **activado** (se ve más profesional en video)
- [ ] Zoom del navegador: **90%** (para que entre más contenido en pantalla)
- [ ] Ventana del navegador: **pantalla completa**

### Estado inicial de la app
- Estar en la pantalla de **Login** (`#/login`)
- Command Palette cerrado
- Ninguna historia seleccionada

---

## 🎬 GUIÓN ESCENA POR ESCENA

---

### 🔴 ESCENA 1 — El Problema (0:00 – 0:20)
*Pantalla en negro o slide con texto. No empieces con la app todavía.*

**🎙 Narración:**
> "Crear una historia de usuario de calidad — con criterios Gherkin bien definidos, test cases cubiertos y lista para Jira — puede llevar horas.
> Yo construí AFU-COPILOT para cambiar eso. Vamos a ver cómo funciona."

**💡 Tip:** Pausa de 1 segundo antes de abrir el navegador. Genera expectativa.

---

### 🔴 ESCENA 2 — Login y Dashboard (0:20 – 0:50)
*Mostrá el navegador con la pantalla de login.*

**🖱 Acciones en pantalla:**
1. Escribir usuario y contraseña lentamente (que se vea)
2. Click en "Iniciar sesión"
3. Esperar que cargue el Dashboard

**🎙 Narración:**
> "El sistema corre 100% en el navegador, sin servidor propio.
> El dashboard me da un resumen inmediato del proyecto:
> cuántas historias tengo, cuántas tienen criterios, test cases, y sincronización con Jira."

**🖱 Acciones en pantalla:**
4. Mover el cursor suavemente por las 4 stat cards para que se vean los números
5. Quedarte 2 segundos mirando el dashboard

**💡 Tip:** Si las stats son bajas, tenés historias de ejemplo — cargalas antes de grabar.

---

### 🔴 ESCENA 3 — Lista de Historias (0:50 – 1:15)
*Click en "Historias" en el sidebar.*

**🎙 Narración:**
> "Acá están todas mis historias del proyecto. Puedo verlas en cards o en tabla.
> Cada una muestra su estado de completitud: descripción, criterios y test cases."

**🖱 Acciones en pantalla:**
1. Click en el ícono de tabla (vista lista)
2. Pausar 2 segundos — mostrar la tabla con columnas
3. Click en ícono de cards
4. Hacer hover sobre una card para que aparezcan los botones de acción
5. Señalar con el cursor los health dots (•••)

**🎙 Narración:**
> "Estos tres puntos me indican si la historia está completa: descripción, criterios y test cases listos."

---

### 🔴 ESCENA 4 — Crear HU con IA (1:15 – 2:15) ⭐ ESCENA PRINCIPAL
*Click en "+ Nueva historia" o desde el dashboard.*

**🎙 Narración:**
> "Ahora la parte más importante. Voy a crear una historia de usuario usando IA."

**🖱 Acciones en pantalla:**
1. Click en "+ Nueva historia"
2. Completar el formulario lentamente, campo por campo:
   - **Como:** `usuario registrado`
   - **Quiero:** `recuperar mi contraseña olvidada`
   - **Para:** `acceder nuevamente a mi cuenta sin perder mis datos`
3. Completar descripción:
   - `El usuario ingresa su email, recibe un link seguro por correo y puede crear una nueva contraseña en menos de 5 minutos`
4. Seleccionar **Tipo:** Story | **Prioridad:** High | **Story Points:** 5
5. Agregar etiquetas: `autenticación`, `seguridad`

**🎙 Narración:**
> "Completo la estructura ISTQB: Como — Quiero — Para.
> El sistema detecta automáticamente las palabras clave para generar los criterios."

**🖱 Acciones en pantalla:**
6. Click en **"Guardar historia"**
7. *Esperar el toast que aparece*

**🎙 Narración:**
> "En segundos, el sistema generó automáticamente los criterios Gherkin y los test cases."

**💡 Tip:** Asegurate de tener la API key configurada antes de grabar para que la generación sea rápida.

---

### 🔴 ESCENA 5 — Ver Criterios Gherkin y Test Cases (2:15 – 2:50) ⭐
*La app navega automáticamente al detalle. Si no, hacer click en la historia recién creada.*

**🎙 Narración:**
> "Mirá lo que se generó automáticamente."

**🖱 Acciones en pantalla:**
1. Mostrar el tab **"Criterios"** — pausar 3 segundos en los escenarios Gherkin
2. Hacer scroll lento para mostrar todos los escenarios (E1 Happy Path, E2 Datos inválidos, E3 Boundary...)

**🎙 Narración:**
> "Criterios Gherkin completos: happy path, datos inválidos, valores límite, seguridad.
> Todo en formato Given / When / Then, listo para Cucumber."

**🖱 Acciones en pantalla:**
3. Click en tab **"Test Cases"**
4. Mostrar la tabla de TCs — señalar columnas: ID, Tipo, Prioridad, Estado

**🎙 Narración:**
> "Y los test cases derivados de esos criterios, con tipo, prioridad y estado de ejecución."

---

### 🔴 ESCENA 6 — Generación desde Imagen (2:50 – 3:15) 🌟 EL WOW
*Volver a Historias → click en el banner "Analizar imagen →"*

**🎙 Narración:**
> "Pero lo más potente es esto: puedo darle un mockup o screenshot y la IA genera la historia sola."

**🖱 Acciones en pantalla:**
1. Click en **"Analizar imagen →"** del banner naranja
2. Click en el área de upload
3. Seleccionar la imagen de mockup preparada
4. Esperar que cargue el preview
5. Click en **"Generar con IA"**

**🎙 Narración:**
> "Sube el mockup, la IA lo analiza visualmente... y genera la historia completa."

**🖱 Acciones en pantalla:**
6. Mostrar el resultado generado — scroll por los campos completados automáticamente

**💡 Tip:** Usá un mockup de pantalla de login o formulario de pago — son los más reconocibles.

---

### 🔴 ESCENA 7 — Exportación y Jira (3:15 – 3:30)
*Volver a la lista de historias.*

**🖱 Acciones en pantalla:**
1. Click en **"Seleccionar"**
2. Click en 3 cards para seleccionarlas
3. Mostrar el sel-bar que aparece abajo con los chips de IDs
4. Pasar el cursor por los botones: PDF / CSV / Markdown / Enviar a Jira

**🎙 Narración:**
> "Desde acá puedo exportar las historias seleccionadas a PDF, Markdown o CSV,
> o enviarlas directamente a Jira Cloud con un click."

**🖱 Acciones en pantalla:**
5. Click en **"PDF"** — mostrar el PDF que se abre/descarga

---

### 🔴 ESCENA 8 — Command Palette (OPCIONAL — si el tiempo lo permite)
**🖱 Acciones en pantalla:**
1. Presionar `Cmd + K`
2. Escribir `navegar` — mostrar resultados en tiempo real
3. Presionar Escape

**🎙 Narración:**
> "Y para navegar rápido, command palette con búsqueda fuzzy."

---

### 🔴 ESCENA 9 — Cierre (3:30 – 3:50)
*Volver al Dashboard. Mostrar los stats completos.*

**🎙 Narración:**
> "AFU-COPILOT permite a equipos de QA y producto crear historias de usuario de calidad
> en minutos, no en horas.
> Criterios Gherkin, test cases, exportación y Jira — todo integrado.
> El link está en los comentarios."

**🖱 Acciones en pantalla:**
- Dejar la pantalla quieta en el Dashboard mientras hablás
- Fade out suave

---

## 📋 TABLA RESUMEN

| Escena | Pantalla | Duración | Narración clave |
|--------|----------|----------|-----------------|
| 1 | Intro (negro/slide) | 0:20 | "horas → minutos" |
| 2 | Login → Dashboard | 0:30 | Stats del proyecto |
| 3 | Lista de Historias | 0:25 | Cards vs tabla, health dots |
| 4 | Formulario + IA | 1:00 | **Escena principal** |
| 5 | Criterios + TCs | 0:35 | Gherkin automático |
| 6 | Imagen → IA | 0:25 | **El WOW** |
| 7 | Exportar + Jira | 0:15 | Bulk actions |
| 8 | Command Palette | 0:10 | (opcional) |
| 9 | Cierre Dashboard | 0:20 | Call to action |
| **Total** | | **~3:40** | |

---

## 🎙 TIPS DE GRABACIÓN

### Antes de grabar
- **Limpiá el historial** del navegador visible en la barra de direcciones
- Usá un **perfil de Chrome limpio** sin extensiones visibles
- Desactivá notificaciones del sistema operativo (`No Molestar` en Mac)
- Cerrá otras apps que puedan aparecer en el Dock

### Durante la grabación
- Mové el cursor **lento y deliberado** — los movimientos rápidos se ven caóticos en video
- Después de cada acción importante, **pausá 1-2 segundos** para que el viewer procese
- Si algo tarda en cargar, **narrá mientras espera** — no dejes silencio
- Hacé el **hover sobre elementos** que quieras destacar — activa los tooltips y estados

### Audio
- Grabá en un **lugar silencioso** o con micrófono externo
- Hablá un **20% más lento** de lo normal — en video se percibe más rápido
- Si vas a editar después, podés grabar video y audio por separado

### Edición (opcional)
- Agregá **zoom-in** en las partes clave (criterios Gherkin, chips del sel-bar)
- Música de fondo suave (sin letra) a **15-20% de volumen**
- Subtítulos si el público puede no hablar español

### Formato final para LinkedIn
- Resolución: **1920x1080** mínimo
- Duración ideal LinkedIn: **máximo 3 minutos**
- Primer frame: que se vea algo impactante (el dashboard con datos reales, no el login)
- Thumbnail: captura del **detalle de historia con criterios Gherkin** visibles

---

## 🗣 FRASES CLAVE (copy para descripción de LinkedIn)

```
🚀 Construí AFU-COPILOT: una herramienta que genera historias de usuario 
ISTQB con criterios Gherkin y test cases automáticos usando IA.

✅ Desde texto libre → HU estructurada completa
✅ Desde imagen/mockup → OCR + análisis visual con IA  
✅ Integración directa con Jira Cloud
✅ Exportación PDF, Markdown, Gherkin para Cucumber

Corre 100% en el navegador. Stack: Vanilla JS + Vite + 4 providers de IA.

#QA #Testing #IA #ProductManagement #ISTQB #Gherkin
```
