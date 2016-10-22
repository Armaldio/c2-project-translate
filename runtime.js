// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

var languages = {};

/////////////////////////////////////
// Plugin class
cr.plugins_.armaldio_project_translate = function (runtime) {
	this.runtime = runtime;
};

(function () {
	var pluginProto = cr.plugins_.armaldio_project_translate.prototype;

	/////////////////////////////////////
	// Object type class
	pluginProto.Type = function (plugin) {
		this.plugin  = plugin;
		this.runtime = plugin.runtime;
	};

	var typeProto = pluginProto.Type.prototype;

	typeProto.onCreate = function () {
	};

	/////////////////////////////////////
	// Instance class
	pluginProto.Instance = function (type) {
		this.type    = type;
		this.runtime = type.runtime;
	};

	var instanceProto = pluginProto.Instance.prototype;

	instanceProto.onCreate = function () {
		if ((this.remoteurl = this.properties[0]) === "")
			alert("Remote url not defined ! Pleas configure it in the properties of the plugin");
	};

	/**BEGIN-PREVIEWONLY**/
	instanceProto.getDebuggerValues = function (propsections) {
		propsections.push({});
	};
	/**END-PREVIEWONLY**/

	function isCached() {
		return localStorage.getItem("langcache") !== null;
	}

	//////////////////////////////////////
	// Conditions
	function Cnds() {
	};

	Cnds.prototype.OnLoadSuccess = function () {
		console.log("Load success");
		return true;
	};

	Cnds.prototype.OnImportFail = function () {
		return true;
	};

	Cnds.prototype.IsCached = function () {
		console.log("lanaguages are offline : ", isCached());
		return isCached();
	};

	Cnds.prototype.OutdatedCache = function () {
		var outdated = false;

		$.ajax({
			url     : this.remoteurl,
			async   : false,
			dataType: "text",
			success : function (d) {
				var data = JSON.parse(d);
				for (var key in data) {
					if (key === "version") {
						var remoteVersion = parseFloat(data[key]);
						console.log("Remote version = ", remoteVersion);

						var localVersion = parseFloat(localStorage.getItem("langversion"));
						console.log("Local version = ", localVersion);

						if (remoteVersion > localVersion) {
							console.log("Cache is outdated");
							outdated = true;
							break;
						}
					}
				}
			}
		});
		return outdated;
	};


	pluginProto.cnds = new Cnds();

	//////////////////////////////////////
	// Actions
	function Acts() {
	};

	Acts.prototype.Import = function (cache) {
		var self = this;

		try {

			$.ajax({
				url     : this.remoteurl,
				async   : false,
				dataType: "text",
				success : function (d) {
					var list = JSON.parse(d);

					console.log("list", list);

					for (var langname in list) {
						if (langname === "version") {
							localStorage.setItem("langversion", list[langname]);
						} else if (list.hasOwnProperty(langname)) {
							var url = list[langname];
							$.ajax({
								url     : url,
								async   : false,
								dataType: "text",
								success : function (data) {
									var langdata        = JSON.parse(data);
									languages[langname] = langdata;
								}
							});
						}
					}

					console.log("cache : ", cache, "localstorage", typeof localStorage != 'undefined');
					if (cache == 1 && typeof localStorage != 'undefined') {
						console.log("Caching");
						localStorage.setItem("langcache", JSON.stringify(languages));
					}
					self.runtime.trigger(cr.plugins_.armaldio_weblate_translate.prototype.cnds.OnLoadSuccess, self);
					console.log(languages);
				}
			});
		} catch (e) {
			console.log("Error Importing : ", e);
			self.runtime.trigger(cr.plugins_.armaldio_weblate_translate.prototype.cnds.OnLoadSuccess, self);
		}
	};

	Acts.prototype.LoadFromCache = function () {
		var self = this;

		if (isCached()) {
			var cache = localStorage.getItem("langcache");
			languages = JSON.parse(cache);
			console.log("Loading from cache", languages);
			self.runtime.trigger(cr.plugins_.armaldio_weblate_translate.prototype.cnds.OnLoadSuccess, self);
		}
		else {
			alert("Cannot load languages from cache !");
		}
	};

	Acts.prototype.RemoveCache = function () {
		var self   = this;
		var remove = localStorage.removeItem("langcache");
		//TODO error handling
		console.log("Remove : ", remove);
	};

	pluginProto.acts = new Acts();

	//////////////////////////////////////
	// Expressions
	function Exps() {
	};

	Exps.prototype.LanguagesNumber = function (ret) {
		console.log("Languages number : ", Object.keys(languages).length);
		ret.set_int(Object.keys(languages).length);
	};

	Exps.prototype.GetString = function (ret, lang, identifier) {
		console.log("a", languages[lang].hasOwnProperty(identifier));
		if (lang in languages) {
			if (languages[lang].hasOwnProperty(identifier)) {
				ret.set_string(languages[lang][identifier]);
			}
			else {
				ret.set_string("[Unknown identifier " + identifier + " ]");
			}
		}
		else
			ret.set_string("[Unknown language]");
	};

	Exps.prototype.GetLangAt = function (ret, index) {
		if (Object.keys(languages)[index])
			ret.set_string(Object.keys(languages)[index]);
		else {
			console.log("Language number " + index + " doen't exixts");
		}
	};

	pluginProto.exps = new Exps();

}());