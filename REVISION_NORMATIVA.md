# Revisión de requisitos frente a fuentes oficiales

**Fecha de la revisión:** 17 de septiembre de 2026 (séptima pasada)
**Alcance:** requisitos de entrada para perros, gatos, hurones, équidos, conejos
y reptiles en los cinco países de la app (ES, UK, US, CA, AU), más los
protocolos de vacunación que calculan el nivel de protección.

**Las aves se retiraron de la aplicación el 14 de septiembre de 2026.** Los
hallazgos 20 a 22 y 31 a 33 se refieren a requisitos que ya no se muestran; se
conservan por si algún día vuelven.
**Estado:** las 38 correcciones están aplicadas en el código.

Este documento es el registro de qué se comprobó, contra qué fuente y qué se
corrigió. Sirve como respaldo de las listas: cualquiera puede seguir los enlaces
del final y verificarlo por su cuenta.

---

## Resumen

De las cinco listas de perro/gato revisadas, **ninguna estaba completa** y **dos
contenían afirmaciones incorrectas**. La estructura del motor es correcta; el
problema estaba en el contenido de las listas.

Tres errores eran de los que estropean un viaje: la app decía "todo listo" a
alguien que habría sido rechazado en el aeropuerto.

**Todo lo que aparece a continuación ya está corregido en la aplicación.** Se
conserva el detalle porque el valor de este documento no es la lista de fallos,
sino poder demostrar contra qué fuente se comprobó cada dato y cuándo.

---

## Errores graves

### 1. Estados Unidos — falta la edad mínima de 6 meses

Desde el 1 de agosto de 2024, **ningún perro menor de 6 meses puede entrar en
EE. UU.**, venga de donde venga. No hay excepción ni trámite alternativo.

La app no lo menciona. Un usuario con un cachorro de cuatro meses vería su
pasaporte al 100 % y sería rechazado en el mostrador.

> Fuente: CDC, *Bringing a Dog into the U.S.*

### 2. Estados Unidos — el documento que pide la app no existe

La lista actual pide "CDC Health Certificate", "Rabies Certificate (USDA)" e
"Screwworm Inspection". Para un perro que viene de España, Reino Unido, Canadá o
Australia (todos países de riesgo bajo o libres de rabia canina), **el único
documento exigido por los CDC es el recibo del CDC Dog Import Form**, un
formulario en línea gratuito.

Ni certificado de rabia, ni certificado sanitario de los CDC, ni inspección de
gusano barrenador. Las tres filas sobran, y falta la única que importa.

> Fuente: CDC, *Entry Requirements for Dogs from Dog-Rabies-Free or Low-Risk Countries*

### 3. Australia — falta la residencia previa de 180 días

Para entrar desde España o Reino Unido, el animal debe haber residido de forma
continuada en un país aprobado **durante los 180 días anteriores a la
exportación**. Es el requisito que más planes rompe, porque no se puede
improvisar: si no se cumple, no hay trámite que lo arregle, solo esperar.

No aparece en la app.

> Fuente: DAFF, guías paso a paso para países del Grupo 3

---

## Errores de contenido

### 4. Reino Unido — el tratamiento antiparasitario se aplica solo a perros

La app lo muestra igual para perros y gatos. **Solo se exige a perros.** Y el
plazo exacto es entre 24 y 120 horas antes de la llegada, no un genérico
"1–5 días".

> Fuente: GOV.UK, *Bring your pet dog, cat or ferret to Great Britain*

### 5. Canadá — "Actualización Política Garrapatas 2025" no existe

No he encontrado esa política en ninguna fuente de la CFIA. **Hay que eliminarla.**
Es el peor tipo de error que puede tener la app: un requisito inventado que
preocupa al usuario sin motivo.

### 6. Canadá — el permiso de importación es para perros comerciales

La app pide "CFIA Import Certificate" a todo el mundo. Para una mascota personal
**no hace falta permiso de importación**: basta el certificado de vacunación
antirrábica y la inspección en frontera. El permiso aplica a importaciones
comerciales de perros menores de 8 meses.

Además, conviene añadir un dato que tranquiliza: **Canadá no impone cuarentena a
las mascotas personales**, vengan de donde vengan.

> Fuente: CFIA, *Bringing animals to Canada: Importing and travelling with pets*

### 7. Australia — el organismo se llama DAFF, no DAWE

La app dice "Import Permit (DAWE)". Ese departamento cambió de nombre: ahora es
**DAFF** (Department of Agriculture, Fisheries and Forestry).

### 8. Australia — la cuarentena de 10 días no es automática

La app afirma "Cuarentena (10 días)". El mínimo real es **30 días**, y solo baja
a 10 si se hace una *identity check* previa, un paso opcional que debe realizar
un veterinario oficial **antes** del análisis de anticuerpos.

Decir "10 días" sin la condición puede hacer que alguien planifique tres semanas
de menos.

---

## Omisiones importantes

### 9. Falta el plazo de 21 días tras la vacuna antirrábica

Aplica a España/UE y a Reino Unido. Tras la primera vacunación **hay que esperar
21 días completos** antes de viajar. Es probablemente el dato práctico más útil
de todos y no aparece en ninguna parte de la app.

### 10. Falta el orden microchip → vacuna

La vacuna antirrábica **solo es válida si se puso después del microchip**. Si se
hizo al revés, hay que revacunar y volver a contar los 21 días. Es un error
frecuente y caro.

Aplica en la UE, Reino Unido y EE. UU.

### 11. Falta la edad mínima de 12 semanas para la primera vacuna

Un cachorro no puede vacunarse de rabia antes de las 12 semanas, lo que en la
práctica sitúa el primer viaje posible en torno a las 15 semanas.

### 12. Australia — faltan las pruebas y tratamientos obligatorios

Para perros desde España o Reino Unido:

- **RNATT** (anticuerpos antirrábicos), válido **365 días** desde la extracción
- **Brucella canis**, muestra tomada en los 45 días previos a la exportación
- **Leishmania infantum**, dentro de los 45 días previos — especialmente
  relevante saliendo de España, donde es endémica
- **Parásitos internos**: dos tratamientos en los 45 días previos, separados al
  menos 14 días, el segundo dentro de los 5 días anteriores a la salida
- **Parásitos externos**: desde 30 días antes, con producto que mate por
  contacto. Los orales tipo NexGard o Bravecto **no se aceptan**, porque exigen
  que la garrapata pique primero

Dato útil: la prueba de **Ehrlichia canis dejó de exigirse el 1 de noviembre de
2022**, porque la enfermedad ya está establecida en Australia.

### 13. España/UE — el antiparasitario no es general

Solo se exige para entrar en **Finlandia, Irlanda, Malta, Noruega e Irlanda del
Norte**, y solo a perros. En el resto de la UE no aplica.

---

## Lo que estaba bien

- El microchip ISO 11784/11785 como base de identificación, en todos los países
- El pasaporte europeo como documento para movimientos dentro de la UE, y que
  cubre solo perros, gatos y hurones
- El AHC (Animal Health Certificate) como documento de entrada a Reino Unido
- Que Australia exige permiso de importación y cuarentena posterior
- Que Australia exige análisis de anticuerpos y no solo la vacuna
- Toda la arquitectura de regímenes por especie: que équidos, aves, conejos y
  reptiles van por normativas distintas es correcto y es lo que diferencia a
  esta app

---

## Segunda pasada: équidos, aves y reptiles

### 14. Équidos — la piroplasmosis no depende del origen

La app solo la exigía si el animal salía de zona endémica. **EE. UU. la exige a
todos los caballos**, con cELISA negativo en los **15 días previos** a la salida.
El origen cambia el énfasis, no la obligación. Corregido.

### 15. Équidos — el Coggins tiene plazo concreto

Seis meses antes de la exportación, por AGID o ELISA. La app decía "validez
limitada en el tiempo", que no ayuda a nadie a planificar. Corregido.

### 16. Équidos — la cuarentena de EE. UU. no es una sola

Son **3, 7 o 60 días** según el estatus sanitario del país donde el animal
residió los 60 días previos, con un mínimo de 7 días de observación. La
diferencia entre 3 y 60 días es la diferencia entre un viaje y una mudanza.

### 17. Équidos — la metritis contagiosa afecta a más animales de los que decíamos

La app hablaba de "reproductores". La norma estadounidense alcanza a **sementales
y yeguas** que hayan residido o transitado por un país afectado en los **últimos
12 meses**, lo que en la práctica es casi cualquier caballo adulto. Además hay
que **reservar plaza en una instalación de cuarentena CEM aprobada**. Corregido.

### 18. Aves — la cuarentena de EE. UU. puede hacerse en casa

La app decía "en instalación autorizada del destino". En realidad **el permiso
puede autorizar cuarentena domiciliaria**, y esa es la vía habitual para una
mascota. Decirlo mal asusta sin motivo. Corregido.

### 19. Aves — faltaban los plazos del permiso

Se solicita por **APHIS eFile con al menos 7 días hábiles** de antelación, tarda
**7–10 días hábiles** en llegar y **caduca a los 30 días**. Ese último dato es el
que arruina viajes: gente que pide el permiso demasiado pronto.

También faltaba el límite: la vía de mascota personal admite **hasta 5 aves**.

### 20. Reptiles — el trámite tiene nombre y formulario

No es una "declaración de vida silvestre" genérica: es el **formulario USFWS
3-177**, que se presenta en línea por **eDecs**, con entrada por **puerto
designado** y **aviso de llegada 48 horas antes** por tratarse de animal vivo.
Corregido.

---

## Una corrección a mi propia revisión

En la primera pasada puse en duda que Australia prohibiera la entrada de conejos.
**Me equivoqué al dudarlo: la app estaba en lo cierto.** DAFF solo admite conejos
procedentes de Nueva Zelanda; del resto de países están prohibidos, y la vía
existente no está pensada para mascotas.

El texto de la app se queda como estaba.

---

## Protocolos de vacunación

Contrastados con las **guías de vacunación de la WSAVA (2024)**, que son la
referencia internacional para perros y gatos.

### 21. Las vacunas centrales no son anuales

La polivalente del perro y la trivalente del gato estaban puestas a 365 días.
La WSAVA recomienda **expresamente abandonar la revacunación anual**: tras la
pauta inicial y el refuerzo del año, los estudios serológicos respaldan el
**refuerzo trienal**.

Marcar como vencida a los doce meses empujaba a vacunar de más, que es justo lo
que las guías tratan de evitar. Corregido a 1.095 días.

### 22. La leucemia felina no es obligatoria para todos los gatos

Estaba tratada como vacuna esencial. La WSAVA la considera **no esencial en
gatos adultos sin acceso al exterior**: solo la recomienda en cachorros y en
gatos que salen o conviven con otros que salen.

Un gato de interior correctamente no vacunado perdía un 20 % de puntuación por
algo que no necesita. Ahora las vacunas opcionales solo se vigilan si consta
alguna dosis; si no hay ninguna, quedan fuera del cálculo en vez de restar.

### Lo que se mantiene

- La antirrábica sigue a un año, que es el criterio conservador y el que aplica
  en la mayor parte de España. El intervalo real depende del producto y de la
  comunidad autónoma
- Tétanos equino anual y gripe equina cada 6 meses
- Mixomatosis y enfermedad hemorrágica del conejo, anuales
- Desparasitación interna trimestral y externa mensual

Y sobre todo se mantiene lo más importante del diseño: **si el veterinario anotó
la fecha de la próxima dosis, manda esa**. Los intervalos de la tabla son solo
el recurso de última hora, porque un calendario genérico no puede saber qué
producto se usó.

| Ámbito | Organismo | Fuente |
|---|---|---|
| Vacunación de perros y gatos | WSAVA | https://wsava.org/global-guidelines/vaccination-guidelines/ |

---

## Tercera pasada: aves y conejos hacia Reino Unido y Canadá

### 23. Conejos a Reino Unido — faltaban cuatro meses de cuarentena

Es la omisión más grave de todas las encontradas. El conejo se considera
**especie sensible a la rabia**, lo que obliga a una licencia de importación de
la APHA y, por defecto, a **cuatro meses de cuarentena en Inglaterra y Gales,
tres en Escocia**.

La aplicación decía únicamente que los conejos entran «como otros mamíferos, con
licencia previa». Alguien podía planificar unas vacaciones y encontrarse con que
su animal se queda retenido un tercio de año.

Existe una **exención** que lo evita, y es tan importante como el propio plazo:
saliendo de la Unión Europea no hay cuarentena si el conejo nació en una
explotación registrada y vivió siempre en cautividad, la explotación está libre
de rabia y de mixomatosis, y el certificado sanitario incluye la declaración
específica para lagomorfos.

### 24. Aves a Reino Unido — el aviso previo y los cuatro aeropuertos

Hay que **comunicar el viaje a la APHA con al menos un día de antelación**, y
solo se puede entrar por **Heathrow, Gatwick, Edimburgo o Glasgow**. Ninguna de
las dos cosas aparecía, y cualquiera de ellas invalida un billete ya comprado.

La licencia de importación solo se exige desde fuera de la UE; desde la UE y la
EFTA no. La cuarentena de 30 días que ya figuraba es correcta.

### 25. Aves a Canadá — el destino más restrictivo, y el peor descrito

La aplicación pedía un permiso del CFIA y una cuarentena «según origen». Lo real:

- **90 días de posesión previa** del ave en el país de origen antes siquiera de
  solicitar el permiso, sin contacto con otras aves
- **La cuarentena debe estar aprobada antes** de que emitan el permiso: no es un
  trámite posterior sino previo
- **45 días** de cuarentena como mínimo, en un local propio que el CFIA inspecciona
- **El dueño tiene que viajar con el ave**; no se admite enviada por separado
- Certificado veterinario internacional que declare ausencia de gripe aviar
  notificable en los 6 meses previos e inspección en las **72 horas** anteriores
- Máximo **5 psitácidas o 20 aves** de otras especies

### 26. Conejos a Canadá — no son mascotas a efectos del CFIA

Para el CFIA solo son mascotas perros, gatos y hurones. El conejo se tramita como
**animal peletero**, por otro procedimiento. A partir de tres animales se exige
cuarentena de 21 días y reconocimiento veterinario en los 5 días previos.

Por debajo de esa cifra la documentación pública no es concluyente, así que la
aplicación remite a consultar al CFIA en lugar de afirmar un requisito concreto.

| Ámbito | Organismo | Fuente |
|---|---|---|
| Aves de compañía a Gran Bretaña | GOV.UK / APHA | https://www.gov.uk/government/publications/birds-and-poultry-live-and-products-import-information-notes/import-of-pet-birds-import-information-note-iin-pbtc2 |
| Especies sensibles a la rabia a Gran Bretaña | GOV.UK / APHA | https://www.gov.uk/government/publications/live-animals-not-pet-dogs-cats-ferrets-application-for-import-licence |
| Aves de compañía a Canadá | CFIA | https://inspection.canada.ca/en/animal-health/terrestrial-animals/imports/import-policies/live-animals/2011-8 |

---

## Sigue pendiente

- Aves y conejos hacia Canadá y Reino Unido, contrastados solo parcialmente
- Los plazos de cuarentena de aves en Reino Unido y Canadá

---

## Fuentes oficiales localizadas

Estas son las URLs que deberían acompañar a cada bloque de requisitos en la app.

| Ámbito | Organismo | Fuente |
|---|---|---|
| Perros a EE. UU. | CDC | https://www.cdc.gov/importation/dogs/index.html |
| Perros a EE. UU. desde país de riesgo bajo | CDC | https://www.cdc.gov/importation/dogs/rabies-free-low-risk-countries.html |
| Formulario obligatorio EE. UU. | CDC | https://www.cdc.gov/importation/dogs/dog-import-form-instructions.html |
| Mascotas a Gran Bretaña | GOV.UK | https://www.gov.uk/bring-pet-to-great-britain |
| Mascotas dentro de la UE | Comisión Europea | https://food.ec.europa.eu/animals/live-animal-movements/dogs-cats-and-ferrets/movements-within-eu_en |
| Entrada en la UE desde tercer país | Comisión Europea | https://food.ec.europa.eu/animals/live-animal-movements/dogs-cats-and-ferrets/bringing-pet-eu-non-eu-country_en |
| Mascotas a Canadá | CFIA | https://inspection.canada.ca/en/importing-food-plants-animals/pets |
| Perros a Australia, Grupo 3 | DAFF | https://www.agriculture.gov.au/biosecurity-trade/cats-dogs/how-to-import/step-by-step-guides/category-3-step-by-step-guide-for-dogs |
| Gatos a Australia, Grupo 3 | DAFF | https://www.agriculture.gov.au/biosecurity-trade/cats-dogs/how-to-import/step-by-step-guides/category-3-step-by-step-guide-for-cats |
| Anticuerpos antirrábicos (RNATT) | DAFF | https://www.agriculture.gov.au/biosecurity-trade/cats-dogs/rabies-neutralising-antibody |
| Tratamiento antiparasitario Australia | DAFF | https://www.agriculture.gov.au/biosecurity-trade/cats-dogs/step-by-step-guides/parasite-treatment |
| Condiciones de importación, cualquier especie | DAFF BICON | https://bicon.agriculture.gov.au/ |
| Équidos a EE. UU. | USDA APHIS | https://www.aphis.usda.gov/live-animal-import/equine |
| Aves de compañía a EE. UU. | USDA APHIS | https://www.aphis.usda.gov/pet-travel/another-country-to-us-import/birds |
| Cuarentena de aves en EE. UU. | USDA APHIS | https://www.aphis.usda.gov/pet-travel/another-country-to-us-import/birds/federal-quarantine |
| Fauna silvestre y reptiles a EE. UU. | USFWS | https://www.fws.gov/program/office-of-law-enforcement/information-importers-exporters |
| Mascotas exóticas a Australia | DAFF | https://www.agriculture.gov.au/biosecurity-trade/travelling/bringing-mailing-goods/unique-exotic-pets |
| Especies listadas en CITES | CITES | https://cites.org/eng/app/appendices.php |

España pertenece al **Grupo 3** de Australia, igual que Reino Unido.
Ninguno de los cinco países figura en la lista de alto riesgo de rabia canina de
los CDC.

---

## Cuarta pasada: lo que quedó a medias — 13 de septiembre de 2026

Las tres pasadas anteriores dejaron dos huecos reconocidos: reptiles hacia Reino
Unido y Canadá, verificados solo en parte, y conejos a Canadá, donde la
documentación pública del CFIA no era concluyente. Se cierran aquí, y en el
camino aparece un error propio.

### 27. Reino Unido — la app exigía un permiso que no existe

**Decía:** licencia de importación de la APHA, certificado sanitario oficial, y
el aviso de que los reptiles «no viajan como animales de compañía».

**Dice la fuente:** las tres cosas son falsas para Gran Bretaña. La nota de
importación **IIN BLLV/8** admite reptiles de compañía sin licencia, sin
certificado sanitario y sin pasar por Puesto de Control Fronterizo. Textual:
*«They do not need to be accompanied by a health certificate or undergo
veterinary checks on entry into GB»* y *«do not need to be imported via a
Border Control Post»*.

**Lo único que se exige** es una declaración firmada del propietario diciendo
que el animal está sano para hacer el viaje y que no va destinado a la venta.

Era el error más caro de los tres: mandaba al usuario a tramitar una licencia
que nadie le va a pedir.

### 28. Reino Unido — faltaba la prohibición que sí puede parar el viaje

La lista de **especies exóticas invasoras** prohíbe la entrada por completo, sin
permiso posible. Alcanza a la tortuga de orejas rojas (*Trachemys scripta*), que
es de las más comunes como mascota. La app no la mencionaba.

También faltaba que **las salamandras y los tritones quedan fuera de esa vía**
por el hongo *Bsal*: necesitan certificación sanitaria específica bajo la
Decisión (UE) 2018/320.

### 29. Canadá — la tortuga no va por el mismo camino que el resto

**Decía:** «permiso de importación · CFIA / ECCC», sin más.

**Dice la fuente:** el documento de referencia de importación separa dos casos.
Las tortugas, de tierra y de agua, solo entran con permiso del ministro
(apartado 22). El resto de reptiles cae en «otros animales no especificados»
(apartado 25): o permiso, o que un inspector se dé por satisfecho de que no hay
riesgo de enfermedad transmisible.

Además, **CITES lo emite ECCC y no el CFIA**: son dos trámites separados en dos
organismos distintos, y la app los presentaba como uno.

### 30. Conejos a Canadá — un dato que estaba mal, y era mío

**Decía:** a partir de tres conejos, cuarentena de 21 días y reconocimiento
veterinario en los 5 días previos a la salida.

**Dice la fuente:** ese requisito existe, pero es el de **exportar desde Canadá
a la Unión Económica Euroasiática** —Rusia, Bielorrusia, Kazajistán, Armenia y
Kirguistán—. Dirección equivocada y destino equivocado. Lo introduje yo en la
tercera pasada, al tomar por requisito de entrada lo que era un certificado de
salida.

**Lo que sí consta:** el CFIA no publica ninguna política de importación para
lagomorfos. No aparecen ni en el documento de referencia de importación ni en la
lista de políticas por especie. Los requisitos reales viven en **AIRS**, su
sistema de consulta, y dependen de la especie y del país de salida. La app dice
ahora eso: dónde mirar, y que hay que mirarlo antes de comprar billetes.

Es la misma clase de error que la «Actualización Política Garrapatas 2025» del
hallazgo 5: un requisito con aspecto verosímil, atribuido a un organismo real,
que nadie exige. Conviene anotarlo: en esta materia lo fácil no es equivocarse
de dato, es equivocarse de documento.

### Enlaces que se habían movido

Al montar la comprobación automática (`npm run normativa`) salieron dos fuentes
con 404, y las dos iban impresas en los PDF que el usuario lleva a la frontera:

| Iba a | Está en |
|---|---|
| `food.ec.europa.eu/.../equidae_en` | `food.ec.europa.eu/.../equine-animals_en` |
| `food.ec.europa.eu/.../pet-birds_en` | ya no existe |

Para las aves no hay sustituto europeo: la Comisión solo publica reglas de
mascota para perros, gatos y hurones, y remite a la norma de cada país para las
demás especies. Su página de «aves cautivas» es de comercio, no de mascotas, y
llevaría al usuario a un trámite que no le toca hacer. Se pasa a la fuente
nacional (MAPA).

---

## Fuentes de esta pasada

| Ámbito | Organismo | Fuente |
|---|---|---|
| Reptiles de compañía a Gran Bretaña | APHA · IIN BLLV/8 | https://www.gov.uk/government/publications/invertebrates-amphibians-or-reptiles-live-or-germinal-products-import-information-notes/import-of-pet-invertebrates-other-than-bees-molluscs-and-crustaceans-amphibians-except-salamanders-and-reptiles-import-information-note-iin |
| Animales a Canadá, documento de referencia | CFIA | https://inspection.canada.ca/en/animal-health/terrestrial-animals/imports/import-policies/general/reference-document |
| Políticas de importación por especie | CFIA | https://inspection.canada.ca/en/animal-health/terrestrial-animals/imports/import-policies/live-animals |
| Requisitos por especie y origen | CFIA · AIRS | https://inspection.canada.ca/en/importing-food-plants-animals/airs |
| Exportación a la Unión Económica Euroasiática | CFIA | https://inspection.canada.ca/en/animal-health/terrestrial-animals/exports/pets/eurasian-economic-union |
| Équidos en la UE | Comisión Europea | https://food.ec.europa.eu/animals/live-animal-movements/equine-animals_en |

---

## Cómo mantener esto vivo

Dos comprobaciones, ambas en un segundo:

```
npm run normativa    # avisa a los 6 meses y detecta enlaces movidos
npm run i18n         # que nada quede sin traducir
```

La primera es la que importa aquí: las normas de importación cambian, y las
páginas de los ministerios se mueven de sitio sin avisar. Un enlace roto en el
PDF que alguien lleva a la frontera es peor que no haberlo puesto.

---

## Quinta pasada: aves a Australia — 14 de septiembre de 2026

Aviso de la propietaria tras consultar la DAFF. Se verifica y resulta correcta.

### 31. Australia — no es un trámite difícil, es que no se puede

**Decía la app:** permiso DAFF, certificados de gripe aviar, Newcastle y
psitacosis, cuarentena previa y posterior, certificado sanitario. Y al final
una nota: «Australia solo admite aves de un listado muy corto: confírmalo
antes de nada».

Eso describe un camino difícil. **No hay camino.**

**Dice la DAFF:** *«You can import some pet psittacine bird species into
Australia from New Zealand. You cannot import pet birds from any other
country.»*

Nueva Zelanda no es ninguno de los orígenes que maneja la aplicación. Desde
España, Reino Unido, Estados Unidos o Canadá, la entrada está **prohibida**, y
no hay permiso que lo salve.

La suspensión viene de **1995**. Existe una revisión de riesgo abierta que
propone reabrir la entrada desde países aprobados, pero el informe final lleva
años sin publicarse; la última actualización oficial localizada es de febrero
de 2023. No sirve para planificar un viaje concreto.

**Por qué importaba tanto.** Dar una lista de trámites para algo prohibido es
peor que no decir nada. El usuario se pone a reunir papeles, paga analíticas y
certificados veterinarios —que no son baratos— y descubre el muro cuando ya ha
gastado el dinero. La nota del final no compensaba: iba después de ocho
requisitos presentados como alcanzables.

### 32. Un nivel de aviso para lo que no se puede hacer

El semáforo de la app tenía tres niveles, y el peor decía «trayecto de plazos
largos: los plazos se miden en meses, no en días». Para una prohibición eso
invita justamente a lo que no hay que hacer, que es empezar.

Se añade un cuarto nivel, **prohibido**, con su propio color y su propio texto:
*«Este trayecto no está permitido. No es cuestión de plazos ni de papeles.»*
Se aplica a aves y conejos hacia Australia, los dos casos verificados.

Además, en esos trayectos el porcentaje de preparación queda en **cero**:
todos los apartados pasan a informativos. Enseñar «50 % listo» en un viaje que
no se puede hacer es la misma mentira con otra cara.

### 33. Canadá — la gripe aviar no se pide siempre

Aquí la app se quedaba corta en el otro sentido: presentaba el certificado de
gripe aviar como obligación fija.

**Dice el CFIA:** solo se exige si el país de salida **no está reconocido libre
de gripe aviar altamente patógena**. Si lo está, no hace falta.

Se corrige para que el usuario lo confirme antes de pagar analíticas que
pueden no corresponderle. El resto de la lista de Canadá —90 días de posesión
previa, permiso con cuarentena aprobada de antemano, dueño acompañando,
45 días de cuarentena, límite de 5 psitácidas o 20 aves— se contrastó de nuevo
contra la política 2011-8 y es correcta.

---

## Fuentes de esta pasada

| Ámbito | Organismo | Fuente |
|---|---|---|
| Aves de compañía a Australia | DAFF | https://www.agriculture.gov.au/biosecurity-trade/import/goods/live-animals/pet-birds |
| Revisión de riesgo, psitácidas | DAFF | https://www.agriculture.gov.au/biosecurity-trade/policy/risk-analysis/animal/psittacine-birds |
| Aves de compañía a Canadá | CFIA · política 2011-8 | https://inspection.canada.ca/en/animal-health/terrestrial-animals/imports/import-policies/live-animals/2011-8 |

**Nota sobre la DAFF:** su web rechaza las consultas automáticas, así que
`npm run normativa` no puede comprobar esos enlaces y los marca «a ojo». Hay
que abrirlos a mano de vez en cuando.

---

## Sexta pasada: la trivalente felina — 14 de septiembre de 2026

Aviso de la propietaria: «¿por qué la trivalente de un gato dura 4 años?».

### 34. El intervalo era correcto; la nota mentía sobre la fecha

**El dato clínico está bien.** La WSAVA recomienda para el gato adulto
revacunación con las vacunas centrales —panleucopenia, calicivirus y
herpesvirus— *no más a menudo que cada 3 años*. La app propone 1.095 días, que
son exactamente esos 3 años, y el cálculo es correcto: 12/12/2025 da
11/12/2028.

**Lo que fallaba era la nota.** Salía siempre que hubiera una fecha escrita en
«próxima dosis», dijera lo que dijera esa fecha. Así que junto a una fecha
puesta a mano a cuatro años vista se leía «Trivalente: refuerzo cada 3 años», y
parecía que ese plazo lo había calculado la aplicación. Lo que dice el
protocolo y lo que dice el campo son dos cosas distintas, y cuando no coinciden
hay que decirlo en vez de dejar que se contradigan en silencio.

Ahora, si la fecha escrita no cuadra con el protocolo, la nota lo canta: «La
fecha que has puesto son 4 años: comprueba que es la que quieres».

La comparación se hace entre las dos frases, no entre los días. Un veterinario
pone fechas redondas, y avisar de que «tres años y tres semanas» no son
exactamente tres años sería ruido. Solo se avisa cuando el usuario lee un
número distinto del que dice el protocolo.

### 35. Faltaba el matiz de los tres componentes

Decir «cada 3 años» a secas es correcto para un gato de interior y se queda
corto para el resto. La WSAVA separa los componentes de la trivalente: la
panleucopenia deja memoria larga y aguanta el trienio, pero la protección
frente a herpesvirus y calicivirus es **solo parcial**, y para un gato que sale
a la calle, vive con otros o pasa por residencias, la guía contempla repetir
esa parte cada año.

La app lo dice ahora, junto al intervalo, y remite al veterinario.

---

## Fuentes de esta pasada

| Ámbito | Organismo | Fuente |
|---|---|---|
| Vacunación de perros y gatos, 2024 | WSAVA | https://wsava.org/wp-content/uploads/2024/05/2024-Guidelines-for-the-Vaccination-of-Dogs-and-Cats.pdf |


---

## Séptima pasada: los números de emergencia — 17 de septiembre de 2026

Aviso de la propietaria: «si voy a viajar a Reino Unido no puede ser el 112».

### 36. El número dependía del GPS, y sin GPS se inventaba uno

La pantalla de SOS resolvía el país por geolocalización. Si el GPS no
contestaba —dentro de un edificio, sin permiso concedido, en un aeropuerto—
caía en el 112 y no había forma de corregirlo: ningún selector, ninguna
lista. El usuario veía «UBICACIÓN NO DISPONIBLE · 112» y se acabó.

El 112 funciona en toda Europa, así que el fallo pasaba desapercibido en
casa. **Fuera de Europa no sirve para nada**: en Estados Unidos hay que
marcar el 911 y en Australia el 000. Es decir, fallaba justo donde la
aplicación dice servir, que es viajando.

Ahora el país se elige a mano, lo elegido manda sobre lo detectado, y la
elección se recuerda: quien está de viaje la hace una vez, no en cada susto.

### 37. La tabla tenía doce países y dos números equivocados

Contrastada con la Comisión Europea (Your Europe) y con la EENA. El dato que
simplifica media tabla: **el 112 funciona en los 27 países de la Unión
Europea**, sin excepción, y además en Albania, Georgia, Islandia,
Liechtenstein, Macedonia del Norte, Moldavia, Montenegro, Noruega, Reino
Unido, Serbia, Suiza y Turquía.

La tabla pasa de 12 países a 47. Y se corrigen dos:

| País | Decía | Dice |
|---|---|---|
| Francia | 15 | 112, con el 15 como alternativa |
| Italia | 118 | 112, con el 118 como alternativa |

El 15 y el 118 son los números médicos propios y funcionan, pero a alguien
de paso le sirve mejor el general: no obliga a acordarse de cuál es cuál. Al
revés ocurre en el Reino Unido, donde el 999 sigue siendo el principal y va
delante del 112.

El campo de número alternativo solo se rellena donde la fuente lo confirma.
En una pantalla de emergencia es mejor quedarse corto que prometer un número
que no entre.

### 38. «Emergencias veterinarias» no era lo que parecía

El primer recuadro daba el número general de emergencias bajo ese rótulo. No
es lo mismo: **un 112 o un 911 no mandan un veterinario**. Sirven para lo que
sí son —un atropello, un incendio, un animal que ha mordido a alguien— y para
eso hay que llamarlos. Lo veterinario es el recuadro de debajo, el del
hospital de guardia.

Pasa a llamarse «Emergencias generales», con una línea que lo aclara. Quien
llama en mitad de un susto no tiene por qué saber esa diferencia.

---

## Fuentes de esta pasada

| Ámbito | Organismo | Fuente |
|---|---|---|
| El 112 en la Unión Europea | Comisión Europea · Your Europe | https://europa.eu/youreurope/citizens/travel/security-and-emergencies/emergency/index_en.htm |
| Países donde funciona el 112 | EENA | https://eena.org/about-112/whats-112-all-about/ |