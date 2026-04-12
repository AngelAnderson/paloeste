---
title: Mejorar las respuestas del bot
order: 6
emoji: 🚩
---

# Curar respuestas del bot

El bot no es perfecto. A veces contesta mal. Tu trabajo (y el mío) es irlo mejorando poco a poco marcando las respuestas malas y sugiriendo qué debió contestar.

## Cómo marcar una respuesta mala

1. En el inbox, abre una conversación
2. Pasa el mouse sobre cualquier respuesta del bot (mensajes azules a la derecha que NO digan "manual")
3. Aparece un botón pequeño **🚩** a la derecha del mensaje
4. Click → abre un modal

## Qué pedirá el modal

**Dos cosas:**

### 1. ¿Por qué esta respuesta fue mala?

Ejemplo: "El vecino preguntó por helados y el bot le dio información de una farmacia" o "Recomendó un negocio que ya no existe" o "El tono fue muy formal"

### 2. ¿Qué debió contestar?

Escribe la respuesta correcta. Ejemplo: "The Gold Ice Cream está en el casco urbano, Rex Cream en Joyuda, y Baskin Robbins en Galería 100."

Click "Guardar para mejorar".

## Qué pasa después

El feedback se guarda en una lista en `/admin/feedback`. Yo la reviso semanalmente y uso esas correcciones para:

1. Actualizar los datos del bot (negocios nuevos, horarios, etc.)
2. Ajustar el tono y el estilo de respuesta
3. Entrenar el bot para que aprenda de sus errores

## No hace falta marcar todo

**Solo marca lo que realmente importa.** Si el bot contestó "ok" a un "gracias", eso no hace falta marcarlo. Marca solo:

- Información incorrecta
- Negocios que no existen o ya cerraron
- Tono fuera de lugar
- Cuando el bot dijo "no lo tengo claro" pero tú sabes que sí existe

## Ver lo marcado

En el menú izquierdo → **🚩 Mejoras**. Ahí ves todas las respuestas que tú y yo hemos marcado, con sus correcciones.
