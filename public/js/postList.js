$(function(){
  const table = createDataTable('#postTable', {
    order: [[3, 'desc']],
    columnDefs: [
      { targets: 0, orderable: false, className: 'text-center' },
      { targets: [1], className: 'text-start' }
    ]
  });

  $('#postTable').on('click', '.delete', function(){
    const id = $(this).data('id');
    if(confirm('정말 삭제하시겠습니까?')){
      fetch('/post/delete?docid=' + encodeURIComponent(id), { method: 'DELETE' })
        .then(res => res.ok ? location.reload() : alert('삭제 실패'));
    }
  });
});
