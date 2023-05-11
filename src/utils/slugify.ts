export function slugify(str: string) {
	str = str.replace(/^\s+|\s+$/g, ""); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "ıüöçğàáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	var to = "iuocgaaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
	}

	str = str
		.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
		.replace(/\s+/g, "-") // collapse whitespace and replace by -
		.replace(/-+/g, "-"); // collapse dashes
	// remove trailing dashes
	if (str.startsWith("-")) {
		str = str.substring(1);
	} else if (str.endsWith("-")) {
		str = str.substring(0, str.length - 1);
	}
	return str;
}
