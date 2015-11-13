var Config = function(defaults, localStorageId) {
    if (!localStorage) {
        console.log("Warning: LocalStorage is not supported, config will not auto save");
    }
    
    this._defaults = defaults;
    this._localStorageId = localStorageId;
    _.defaults(this, {
        _defaults: {},
        _localStorageId:"config"
    })
    
    // Normalize everything to the object form
    this._defaults = _.mapObject(this._defaults, function(v,k) {
        if (_.has(v, "value")) {
            return v;
        } else {
            return {value:v};
        }
    })
    
    _.extend(this, 
        _.mapObject(this._defaults, function(v,k) {
            return v.value;
        })
    );
    
    this._load(_.keys(defaults));
    
    console.log("Loaded.", this);
}

Config.prototype._load = function(keys) {
    if (!localStorage) {return;}
    var loaded = JSON.parse(localStorage.getItem(this._localStorageId) || "{}");
    
    if (keys.length) {
        loaded = _.pick(loaded, keys);
    }
    _.extend(this, loaded);
}

Config.prototype._save = function() {
    if (!localStorage) {return;}
    var data = _.pick(this, this._keys());
    localStorage.setItem(this._localStorageId, JSON.stringify(data));
}

Config.prototype._keys = function() {
    return _.filter(_.keys(this), function(k) {return k[0] != "_"})
}

Config.prototype._buildTable = function(table) {
    _.each(this._defaults, function (settings, id) {
        var input = $("<input>", {"id":id});
        
        if (this[id]) input.val(this[id])
    
        $(table).append(
            $("<tr>").append(
                $("<th>").text(id),
                $("<td>").append(input)
            )
        );
        
        var config = this;

        input.change(function (e) {
            console.log("In input change");
            if (settings.onChange) settings.onChange(e)
            console.log("Setting " + e.target.id + " to " + e.target.value);
            config[e.target.id] = e.target.value;
            config._save();
        });
        settings.input = input;
    }, this);
}

Config.prototype._buildForm = function(form) {
    var template = $(form).find("div.template").remove();
    template.removeClass("template");
    
    _.each(this._defaults, function (settings, id) {
        var field = template.clone();
        form.append(field);
        
        var input = field.find("input");
        
        input.attr("id", id);
        field.find("label").attr("for", id).text(id);
        
        if (this[id]) input.val(this[id])
    
        var config = this;

        input.change(function (e) {
            console.log("Setting " + e.target.id + " to " + e.target.value);
            if (settings.onChange) settings.onChange(e)
            config[e.target.id] = e.target.value;
            config._save();
        });
        settings.input = input;
    }, this);
}