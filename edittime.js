function GetPluginSettings() {
	return {
		"name"       : "Project Translation",
		"id"         : "armaldio_project_translate",
		"version"    : "1.0",
		"description": "Allow you to translate your game in different languages",
		"author"     : "Armaldio",
		"help url"   : "",
		"category"   : "Web",
		"type"       : "object",			// not in layout
		"rotatable"  : false,
		"flags"      : pf_singleglobal
	};
}

//////////////////////////////////////////////////////////////
// Conditions
//AddCondition(0, 0, "Cookies enabled", "Browser", "Cookies are enabled", "Browser has cookies enabled.", "CookiesEnabled");
AddCondition(0, cf_trigger, "Languages loaded", "Languages", "On Languages loaded", "Trigger when languages are succesfully loaded", "OnImportSuccess");

//AddCondition(1, cf_none, "Languages are cached", "Languages", "If language are available offline", "Check if languages are available offline", "IsCached");

//AddCondition(2, cf_none, "Cache is outdated", "Languages", "If chache outdated", "Check if local cache is outdated", "OutdatedCache");

AddCondition(3, cf_trigger, "Languages loading fail", "Languages", "On Import fail", "When importing from url failed", "OnImportFail");

AddCondition(4, cf_trigger, "Languages loading progress", "Languages", "On Import progress", "When importing progress changed", "OnProgress");

//////////////////////////////////////////////////////////////
// Actions

/*
AddComboParamOption("No");
AddComboParamOption("Yes");
AddComboParam("Cache", "Download files for offline usage");
AddAction(0, 0, "Load from url", "Load", "Import file", "Import Language list", "Import");

AddAction(1, 0, "Load from cache", "Load", "Load languages from cache", "Load languages from cache", "LoadFromCache");
AddAction(2, 0, "Remove cache", "Cache", "Remove cache", "Remove cache", "RemoveCache");
*/

AddFileParam("File", "Select a project file to request.");
AddAction(3, 0, "Load from file", "Load", "Import file {0}", "Import Language list", "ImportFileList");

AddStringParam("Language", "Must match languages in the list imported at start");
AddAction(4, 0, "Translate text", "Translation", "Translate all default text plugins to {0}", "Translate all default text plugins", "TranslateText");


//////////////////////////////////////////////////////////////
// Expressions
//AddExpression(3, ef_return_number, "Absolute mouse Y", "Cursor", "AbsoluteY", "Get the mouse cursor Y co-ordinate on the canvas.");
AddExpression(0, ef_return_number, "Get languages number", "Translation", "LanguagesNumber", "Get the available languages number");

AddNumberParam("Index", "The index of the language");
AddExpression(1, ef_return_string, "Get language id at index", "Translation", "GetLangAt", "Get language id at specific index");

AddNumberParam("Index", "The index of the language");
AddExpression(2, ef_return_string, "Get language name at index", "Translation", "GetLangNameAt", "Get language name at specific index");

AddStringParam("Language", "Must match languages in the list imported at start");
AddStringParam("Identifier", "The identifier to identify the string");
AddExpression(3, ef_return_string, "Get string", "Translation", "GetString", "Get translated string from language and identifier");

ACESDone();

// Property grid properties for this plugin
var property_list = [
	new cr.Property(ept_text, "Lang list url", "http://", "The url of your language list")
];

// Called by IDE when a new object type is to be created
function CreateIDEObjectType() {
	return new IDEObjectType();
}

// Class representing an object type in the IDE
function IDEObjectType() {
	assert2(this instanceof arguments.callee, "Constructor called as a function");
}

// Called by IDE when a new object instance of this type is to be created
IDEObjectType.prototype.CreateInstance = function (instance) {
	return new IDEInstance(instance, this);
}

// Class representing an individual instance of an object in the IDE
function IDEInstance(instance, type) {
	assert2(this instanceof arguments.callee, "Constructor called as a function");

	// Save the constructor parameters
	this.instance = instance;
	this.type     = type;

	// Set the default property values from the property table
	this.properties = {};

	for (var i = 0; i < property_list.length; i++)
		this.properties[property_list[i].name] = property_list[i].initial_value;
}

// Called by the IDE after all initialization on this instance has been completed
IDEInstance.prototype.OnCreate = function () {
}

// Called by the IDE after a property has been changed
IDEInstance.prototype.OnPropertyChanged = function (property_name) {
}

// Called by the IDE to draw this instance in the editor
IDEInstance.prototype.Draw = function (renderer) {
}

// Called by the IDE when the renderer has been released (ie. editor closed)
// All handles to renderer-created resources (fonts, textures etc) must be dropped.
// Don't worry about releasing them - the renderer will free them - just null out references.
IDEInstance.prototype.OnRendererReleased = function () {
}
