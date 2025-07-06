import React from 'react';

function CoupangDetailModal({ data, onClose }) {
  if (!data) return null;
  const { item, options } = data;
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{item['Product name']}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p>
                <strong>옵션ID:</strong> {item['Option ID']}
              </p>
              <p>
                <strong>최근 30일 판매금액:</strong>{' '}
                {item['Sales amount on the last 30 days']}
              </p>
              <p>
                <strong>최근 30일 판매량:</strong>{' '}
                {item['Sales in the last 30 days']}
              </p>
              <h6 className="mt-3">옵션 목록</h6>
              <ul className="list-group">
                {options.map((o) => (
                  <li
                    key={o['Option ID']}
                    className="list-group-item d-flex justify-content-between"
                  >
                    <span>{o['Option name']}</span>
                    <span>{o['Orderable quantity (real-time)']}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
}

export default CoupangDetailModal;
