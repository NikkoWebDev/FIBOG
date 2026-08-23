# Borrador de correo — Facultad de Ingeniería

---

**Asunto:** Plataforma web de Semilleros de Investigación — Propuesta y avances

---

Estimados(as) integrantes de la Facultad de Ingeniería,

Me dirijo a ustedes para presentarles el desarrollo de una plataforma web diseñada para centralizar, organizar y visibilizar los grupos de investigación, semilleros y comunidades estudiantiles de la facultad. El objetivo es que los estudiantes puedan explorar de manera sencilla las oportunidades académicas disponibles y que los líderes de grupo cuenten con un espacio para gestionar su información.

## Funcionalidades principales de la plataforma

- **Catálogo público** de grupos con diseño responsivo y accesible, que permite visualizar todos los semilleros y grupos de investigación en una cuadrícula moderna tipo "Bento Grid".
- **Filtros avanzados** por tipo de grupo (Semillero / Grupo de Investigación / Grupo Estudiantil), por carrera y por búsqueda de texto.
- **Búsqueda asistida por inteligencia artificial**, que ofrece recomendaciones contextuales a los estudiantes según sus intereses y el perfil de los grupos.
- **Portal de administración (Super Admin)** con panel de métricas, gestión completa de grupos (CRUD), sistema de aprobación de nuevas solicitudes y administración de usuarios.
- **Panel de líder de grupo** para que los responsables de cada semillero o grupo puedan editar y mantener actualizada su información.
- **Sistema de roles** con tres niveles: Super Administrador, Administrador de Grupo y Visitante.
- **Flujo de registro y aprobación** de nuevos grupos, con revisión por parte del comité correspondiente.
- **Perfil de usuario** con gestión de contraseña y enlaces a redes sociales o contacto.
- **Modo oscuro por defecto** con opción de alternar a modo claro.
- **Enfoque en privacidad**: sin cookies de rastreo, sin analíticas invasivas ni almacenamiento de datos personales de visitantes públicos.

## Tecnologías utilizadas

| Categoría | Herramienta | Propósito |
|---|---|---|
| **Framework** | Astro 4.x | Generación de sitio estático (SSG), renderizado híbrido |
| **Lenguaje** | TypeScript (modo estricto) | Lógica del lado del cliente y del servidor |
| **Estilos** | Tailwind CSS 3.x | Sistema de diseño utilitario, personalizable para adaptarse a cualquier identidad de marca |
| **Animaciones** | GSAP (GreenSock) + ScrollTrigger | Animaciones de entrada y transiciones suaves |
| **Backend / Base de datos** | Supabase | PostgreSQL con Row Level Security, autenticación y funciones serverless |
| **API de IA** | OpenRouter API | Búsqueda semántica y recomendaciones inteligentes |
| **Despliegue** | Vercel | Hosting híbrido + funciones serverless para endpoints |
| **Iconografía** | Lucide React / Material Symbols | Íconos vectoriales |
| **Tipografía** | Google Fonts | Fuentes web (Inter, JetBrains Mono, Geist) |
| **Control de versiones** | Git | Repositorio del proyecto |

## Adaptación a la identidad de marca de la facultad

La plataforma está construida con **Tailwind CSS**, lo que permite modificar de forma ágil y centralizada toda la paleta de colores, tipografías y estilos visuales para alinearlos con el manual de identidad de la Facultad de Ingeniería. La arquitectura separa claramente el contenido de la presentación, facilitando cualquier ajuste estético que se requiera.

Quedo atento a sus comentarios y sugerencias. Quedo a disposición para coordinar una reunión donde podamos revisar la plataforma en detalle y definir los pasos a seguir para su publicación y alineación con la imagen institucional.

Cordialmente,

[Nombre]
[Correo electrónico]
[Teléfono / contacto]
