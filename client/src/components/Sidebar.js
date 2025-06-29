import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const navData = [
  {
    category: '내의미',
    items: [
      { label: '게시판', path: '/board' },
      { label: '재고관리', path: '/stock' },
      { label: '매출금액', path: '/sales-amount' },
      { label: '판매량', path: '/sales-volume' },
      { label: '광고내역', path: '/ad-history' },
      { label: '관리자', path: '/admin' }
    ]
  },
  {
    category: 'TRY',
    items: [
      { label: '게시판', path: '/try/board' },
      { label: '재고관리', path: '/try/stock' },
      { label: '매출금액', path: '/try/sales-amount' },
      { label: '판매량', path: '/try/sales-volume' },
      { label: '광고내역', path: '/try/ad-history' },
      { label: '입고요청', path: '/try/inbound-request' }
    ]
  },
  {
    category: 'BYC',
    items: [
      { label: '게시판', path: '/byc/board' },
      { label: '재고관리', path: '/byc/stock' },
      { label: '매출금액', path: '/byc/sales-amount' },
      { label: '판매량', path: '/byc/sales-volume' },
      { label: '광고내역', path: '/byc/ad-history' },
      { label: '입고요청', path: '/byc/inbound-request' }
    ]
  },
  {
    category: '제임스딘',
    items: [
      { label: '게시판', path: '/james-dean/board' },
      { label: '재고관리', path: '/james-dean/stock' },
      { label: '매출금액', path: '/james-dean/sales-amount' },
      { label: '판매량', path: '/james-dean/sales-volume' },
      { label: '광고내역', path: '/james-dean/ad-history' },
      { label: '입고요청', path: '/james-dean/inbound-request' }
    ]
  },
  {
    category: '쿠팡',
    items: [
      { label: '게시판', path: '/coupang/board' },
      { label: '재고관리', path: '/coupang/stock' },
      { label: '매출금액', path: '/coupang/sales-amount' },
      { label: '판매량', path: '/coupang/sales-volume' },
      { label: '광고내역', path: '/coupang/ad-history' },
      { label: '입고요청', path: '/coupang/inbound-request' }
    ]
  },
  {
    category: '네이버',
    items: [
      { label: '게시판', path: '/naver/board' },
      { label: '재고관리', path: '/naver/stock' },
      { label: '매출금액', path: '/naver/sales-amount' },
      { label: '판매량', path: '/naver/sales-volume' },
      { label: '광고내역', path: '/naver/ad-history' },
      { label: '입고요청', path: '/naver/inbound-request' }
    ]
  }
];

function Sidebar() {
  const [openCategory, setOpenCategory] = useState(null);

  const handleToggle = (category) => {
    setOpenCategory((prev) => (prev === category ? null : category));
  };

  return (
    <nav className="sidebar">
      {navData.map((group) => (
        <div key={group.category} className="nav-group">
          <div
            className="nav-category"
            onClick={() => handleToggle(group.category)}
          >
            {group.category}
          </div>
          {openCategory === group.category && (
            <ul>
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="nav-link">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </nav>
  );
}

export default Sidebar;
