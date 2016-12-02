// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.plugins_, "cr.plugins_ not created");

var languages   = {};
var langsToLoad = 0;
var langsLoaded = 0;

var langlist = {};


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


	var next_request_headers = {};
	var next_override_mime   = "";

	instanceProto.doRequest = function (tag_, url_, method_, data_) {
		// In directCanvas: forward request to webview layer
		if (this.runtime.isDirectCanvas) {
			AppMobi["webview"]["execute"]('C2_AJAX_WebSide("' + tag_ + '", "' + url_ + '", "' + method_ + '", ' + (data_ ? '"' + data_ + '"' : "null") + ');');
			return;
		}

		// Create a context object with the tag name and a reference back to this
		var self    = this;
		var request = null;

		var doErrorFunc = function () {
			self.curTag = tag_;
			self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnImportFail, self);
		};

		var errorFunc = function () {
			// In node-webkit, try looking up the file on disk instead since it wasn't found in the project.
			if (isNWjs) {
				var filepath = nw_appfolder + url_;

				if (fs["existsSync"](filepath)) {
					fs["readFile"](filepath, {"encoding": "utf8"}, function (err, data) {
						if (err) {
							doErrorFunc();
							return;
						}

						self.lastData = data.replace(/\r\n/g, "\n")
						self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnImportSuccess, self);
					});
				}
				else
					doErrorFunc();
			}
			else
				doErrorFunc();
		};

		var progressFunc = function (e) {
			if (!e["lengthComputable"])
				return;

			self.progress = e.loaded / e.total;
			self.curTag   = tag_;
			self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnProgress, self);
		};

		try {
			// Windows Phone 8 can't armaldio_project_translate local files using the standards-based API, but
			// can if we use the old-school ActiveXObject. So use ActiveX on WP8 only.
			if (this.runtime.isWindowsPhone8)
				request = new ActiveXObject("Microsoft.XMLHTTP");
			else
				request = new XMLHttpRequest();

			request.onreadystatechange = function () {
				if (request.readyState === 4) {
					self.curTag = tag_;

					if (request.responseText)
						self.lastData = request.responseText.replace(/\r\n/g, "\n");		// fix windows style line endings
					else
						self.lastData = "";

					if (request.status >= 400)
						self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnImportFail, self);
					else {
						// In node-webkit, don't trigger 'on success' with empty string if file not found.
						// In a browser also don't trigger 'on success' if the returned string is empty and the status is 0,
						// which is what happens when onerror is about to fire.
						if ((!isNWjs || self.lastData.length) && !(!isNWjs && request.status === 0 && !self.lastData.length))
							self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnImportSuccess, self);
					}
				}
			};

			if (!this.runtime.isWindowsPhone8) {
				request.onerror       = errorFunc;
				request.ontimeout     = errorFunc;
				request.onabort       = errorFunc;
				request["onprogress"] = progressFunc;
			}

			request.open(method_, url_);

			if (!this.runtime.isWindowsPhone8) {
				// IE requires timeout be set after open()
				if (this.timeout >= 0 && typeof request["timeout"] !== "undefined")
					request["timeout"] = this.timeout;
			}

			// Workaround for CocoonJS bug: property exists but is not settable
			try {
				request.responseType = "text";
			} catch (e) {
			}

			if (data_) {
				if (request["setRequestHeader"] && !next_request_headers.hasOwnProperty("Content-Type")) {
					request["setRequestHeader"]("Content-Type", "application/x-www-form-urlencoded");
				}
			}

			// Apply custom headers
			if (request["setRequestHeader"]) {
				var p;
				for (p in next_request_headers) {
					if (next_request_headers.hasOwnProperty(p)) {
						try {
							request["setRequestHeader"](p, next_request_headers[p]);
						}
						catch (e) {
						}
					}
				}

				// Reset for next request
				next_request_headers = {};
			}

			// Apply MIME type override if one set
			if (next_override_mime && request["overrideMimeType"]) {
				try {
					request["overrideMimeType"](next_override_mime);
				}
				catch (e) {
				}

				// Reset for next request
				next_override_mime = "";
			}

			if (data_)
				request.send(data_);
			else
				request.send();

		}
		catch (e) {
			errorFunc();
		}
	};

	function isCached() {
		return localStorage.getItem("langcache") !== null;
	}

	String.prototype.startsWith = function (prefix) {
		return this.indexOf(prefix) === 0;
	};

	//////////////////////////////////////
	// Conditions
	function Cnds() {
	};

	Cnds.prototype.OnImportSuccess = function (tag) {
		var self = this;

		//console.log(self);

		if (self.curTag === "langlist") {
			langlist = JSON.parse(self.lastData);

			var count = 0;
			$.each(langlist, function (index, value) {
				if (index !== "version") {
					count++;
				}
				langsToLoad = count;
			});

			$.each(langlist, function (index, value) {
				if (index !== "version") {
					if (!languages[index])
						languages[index] = {};
					languages[index]["name"] = value.name;
					self.doRequest(index, value.path, "GET");
				}
			});
		}
		else {
			var data = JSON.parse(self.lastData);
			$.each(data, function (key, value) {
				if (!languages[self.curTag]["keys"])
					languages[self.curTag]["keys"] = {};
				languages[self.curTag]["keys"][key] = value;
			});

			langsLoaded += 1;
			if (langsLoaded === langsToLoad) {
				console.log(languages);
				return true;
			}
		}
		return false;
	};

	Cnds.prototype.OnImportFail = function (tag) {
		return cr.equals_nocase(tag, this.curTag);
	};

	Cnds.prototype.OnProgress = function (tag) {
		return cr.equals_nocase(tag, this.curTag);
	};

	/*
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
	 */

	pluginProto.cnds = new Cnds();

	function getString(lang, identifier) {
		//console.log("a", languages[lang]["keys"].hasOwnProperty(identifier));
		if (lang in languages) {
			if (languages[lang]["keys"].hasOwnProperty(identifier)) {
				return (languages[lang]["keys"][identifier]);
			}
			else {
				return ("[Unknown identifier " + identifier + " ]");
			}
		}
		else {
			return ("[Unknown language]");
		}
	}

	//////////////////////////////////////
	// Actions
	function Acts() {
	};

	/*
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
	 self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnLoadSuccess, self);
	 console.log(languages);
	 }
	 });
	 } catch (e) {
	 console.log("Error Importing : ", e);
	 self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnLoadSuccess, self);
	 }
	 };

	 Acts.prototype.LoadFromCache = function () {
	 var self = this;

	 if (isCached()) {
	 var cache = localStorage.getItem("langcache");
	 languages = JSON.parse(cache);
	 console.log("Loading from cache", languages);
	 self.runtime.trigger(cr.plugins_.armaldio_project_translate.prototype.cnds.OnLoadSuccess, self);
	 }
	 else {
	 alert("Cannot load languages from cache !");
	 }
	 };
	 */

	Acts.prototype.ImportFileList = function (file_) {
		this.doRequest("langlist", file_, "GET");
	};

	Acts.prototype.TranslateText = function (lang) {
		var self = this;

		var instanceObj = self.runtime.objectsByUid;
		$.each(instanceObj, function (index, value) {
			if (value.instance_var_names) {
				var varnames = value.instance_var_names;
				$.each(varnames, function (i, variable) {
					if (variable === "lang") {
						/**
						 * Text and spritefonts
						 */
						value.text = getString(lang, value.instance_vars[i]);
						value.text_changed = true;
						value.runtime.redraw = true;

						/**
						 * Button
						 */
						if (self.runtime.isDomFree)
							return;

						if (value.isCheckbox || value.elem) {
							if (value.isCheckbox)
								value.labelText.nodeValue = getString(lang, value.instance_vars[i]);
							else
								value.elem.value = getString(lang, value.instance_vars[i]);
						}
					}
				})
			}
		});
	};

	/*
	 Acts.prototype.RemoveCache = function () {
	 var self   = this;
	 var remove = localStorage.removeItem("langcache");
	 //TODO error handling
	 console.log("Remove : ", remove);
	 };
	 */

	pluginProto.acts = new Acts();

	//////////////////////////////////////
	// Expressions
	function Exps() {
	};

	Exps.prototype.LanguagesNumber = function (ret) {
		ret.set_int(Object.keys(languages).length);
	};

	Exps.prototype.GetString = function (ret, lang, identifier) {

		ret.set_string(getString(lang, identifier));
	};

	Exps.prototype.GetLangAt = function (ret, index) {
		if (Object.keys(languages)[index]) {
			var key = Object.keys(languages)[index];
			ret.set_string(key);
		}
		else {
			console.log("Language number " + index + " doen't exixts");
		}
	};

	Exps.prototype.GetLangNameAt = function (ret, index) {
		if (Object.keys(languages)[index]) {
			var key = Object.keys(languages)[index];
			ret.set_string(languages[key].name);
		}
		else {
			console.log("Language number " + index + " doen't exixts");
		}
	};

	pluginProto.exps = new Exps();

}());