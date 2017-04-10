# Configuration
## Project Translation plugin - v1.0 - by Armaldio<img src='PluginIcon.ico' alt='Icon'>
Property | Value
--- | ---
Description | Allow you to translate your game in different languages
Category | Web
Cordova-plugins | No
Flags | No
Help | 
Id | armaldio_project_translate
Rotatable | No
Type | object

# Actions
#### There are 2 actions available
**Load from file** : Import Language list *#Load*

* **File** : Select a project file to request.

---

**Translate text** : Translate all default text plugins *#Translation*

* **Language** : Must match languages in the list imported at start

---

# Conditions
#### There are 3 conditions available
**Languages loaded** : Trigger when languages are succesfully loaded *#Languages*


---

**Languages loading fail** : When importing from url failed *#Languages*


---

**Languages loading progress** : When importing progress changed *#Languages*


---

# Expressions
#### There are 4 expressions available
**LanguagesNumber** : Get the available languages number *#Translation*


---

**GetLangAt** : Get language id at specific index *#Translation*

* **Index** : The index of the language

---

**GetLangNameAt** : Get language name at specific index *#Translation*

* **Index** : The index of the language

---

**GetString** : Get translated string from language and identifier *#Translation*

* **Language** : Must match languages in the list imported at start
* **Identifier** : The identifier to identify the string

---


