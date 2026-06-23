var Config = function(defaults) {
    this._defaults = defaults;

    // Normalize all defaults to {value: ...} form
    this._defaults = _.mapObject(this._defaults, function(v, k) {
        return _.has(v, "value") ? v : {value: v};
    });

    // Start from defaults, then load any saved values for the active profile
    _.extend(this, _.mapObject(this._defaults, function(v) { return v.value; }));
    this._load();

    console.log("Loaded config for profile '" + this._activeProfile() + "'", this);
}

// --- Profile helpers ---

Config.prototype._activeProfile = function() {
    return localStorage.getItem("activeProfile") || "default";
}

Config.prototype._storageKey = function() {
    return "config_" + this._activeProfile();
}

Config.prototype.getProfiles = function() {
    return JSON.parse(localStorage.getItem("profileList") || '["default"]');
}

Config.prototype._saveProfileList = function(profiles) {
    localStorage.setItem("profileList", JSON.stringify(profiles));
}

// --- Core load/save ---

Config.prototype._load = function() {
    var saved = JSON.parse(localStorage.getItem(this._storageKey()) || "{}");
    // Only restore keys that exist in defaults
    _.extend(this, _.pick(saved, _.keys(this._defaults)));
}

Config.prototype._save = function() {
    var data = _.pick(this, _.keys(this._defaults));
    localStorage.setItem(this._storageKey(), JSON.stringify(data));
}

// --- Profile switching ---

// Save current values, then load the named profile's values and refresh form inputs.
Config.prototype.switchProfile = function(name) {
    this._save();

    localStorage.setItem("activeProfile", name);

    // Reset to defaults then overlay saved values for the new profile
    _.extend(this, _.mapObject(this._defaults, function(v) { return v.value; }));
    this._load();

    // Refresh rendered form inputs
    _.each(this._defaults, function(settings, id) {
        if (settings.input) {
            settings.input.val(this[id] != null ? this[id] : "");
        }
    }, this);
}

// Create a new profile, copying current values into it, and switch to it.
Config.prototype.createProfile = function(name) {
    var profiles = this.getProfiles();
    if (!_.contains(profiles, name)) {
        profiles.push(name);
        this._saveProfileList(profiles);
    }
    localStorage.setItem("activeProfile", name);
    this._save();  // saves current values under the new profile key
}

// Delete a profile's saved data. Caller is responsible for switching away first.
Config.prototype.deleteProfile = function(name) {
    var profiles = _.without(this.getProfiles(), name);
    this._saveProfileList(profiles);
    localStorage.removeItem("config_" + name);
}

// --- Form builder ---

Config.prototype._buildForm = function(form) {
    var template = $(form).find(".row_template").remove();
    template.removeClass("row_template");

    _.each(this._defaults, function(settings, id) {
        var field = template.clone();
        form.append(field);

        var input = field.find("input");
        input.attr("id", id);
        field.find("label").attr("for", id).text(id);

        var config = this;

        if (settings.type !== "checkbox") {
            input.addClass("form-control");
            if (this[id]) { input.val(this[id]); }
            input.change(function(e) {
                config[e.target.id] = e.target.value;
                config._save();
            });
        } else {
            input.attr("type", "checkbox").addClass("form-check-input");
            input.prop("checked", !!this[id]);
            input.change(function(e) {
                config[e.target.id] = e.target.checked;
                config._save();
            });
        }

        settings.input = input;
    }, this);
}
