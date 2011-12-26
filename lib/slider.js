$(document).ready(function () {
  $('a.dropdown-class').click(function () {
	  $('ul.dropdown').slideToggle('medium');
    $('ul.dropdown').style('position', 'absolute');
  });
});
