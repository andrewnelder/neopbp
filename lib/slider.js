$(document).ready(function () {
  $('a.dropdown-class').click(function () {
	  $('ul.dropdown').slideToggle('medium');
    return false;
  });
});
