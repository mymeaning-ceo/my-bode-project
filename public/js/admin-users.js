$(function(){
  const table = createDataTable('#usersTable');
  $('#usersTable tbody').on('change', 'input[name="userId"]', function(){
    $('#deleteBtn').prop('disabled', false);
  });
});
