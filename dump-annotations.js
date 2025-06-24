// by: GroovMekanik, from: https://discord.com/channels/289378508247924738/351004699811512322/1384131194588758087

autowatch = 1;

/*
   Max JS helper for Max for Live devices
   --------------------------------------
   • get_info <scriptingName>
       Prints the Info-view title + text for a single named UI object.

   • list_all_scripting_names
       Lists every scripting name (varname) in this patcher hierarchy.

   • dump_annotations
       For each named object:
           - If it has an annotation_name →  prints “title – annotation”
           - Else                          →  prints “MISSING  <varname>”
*/

//
// Utility : formatted error printing
//
function error() {
    post("\nError:", arrayfromargs(arguments).join(" "), "\n");
}

//
// 1.  Print Info-view strings for a single object
//
function get_info(scriptingName) {
    var obj = this.patcher.getnamed(scriptingName);
    if (!obj) return error("No object named '" + scriptingName + "' found.");

    var title = obj.getattr("annotation_name");
    var text  = obj.getattr("annotation");

    post(title, " - ", text, "\n");
}

//
// 2.  Dump all scripting names (varnames) in the device
//
function list_all_scripting_names() {
    var names = [];

    this.patcher.applydeep(function (box) {
        if (box.varname && box.varname !== "")
            names.push(box.varname);
        return true;
    });

    post("---- Scripting Names (" + names.length + ") ----\n");
    names.forEach(function (n) { post(n, "\n"); });
    post("----------------------------------------------\n");
    return names;  // returned for programmatic use
}

//
// 3.  Print every annotation OR flag the missing ones
//
function dump_annotations() {
    var missing = [];

    this.patcher.applydeep(function (box) {
        if (!box.varname) return true;      // ignore unnamed objects

        var title, text;
        try {
            title = box.getattr("annotation_name");
            text  = box.getattr("annotation");
        } catch (e) { /* attribute not supported */ }

        if (title) {
            post(title, " - ", text, "\n");
        } else {
            missing.push(box.varname);
        }
        return true;
    });

    if (missing.length) {
        post("---- Objects WITHOUT annotation_name ("+missing.length+") ----\n");
        missing.forEach(function (n) { post(n, "\n"); });
        post("-------------------------------------------------------------\n");
    } else {
        post("All named objects have annotation_name.\n");
    }
}
