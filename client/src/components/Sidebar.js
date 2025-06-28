import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const navData = [
  { category: '내의미', items: ['게시판', '재고관리', '매출금액', '판매량', '관리자'] },
  { category: 'TRY', items: ['게시판', '재고관리', '매출금액', '판매량', '입고요청'] },
  { category: 'BYC', items: ['게시판', '재고관리', '매출금액', '판매량', '입고요청'] },
  { category: '제임스딘', items: ['게시판', '재고관리', '매출금액', '판매량', '입고요청'] },
  { category: '쿠팡', items: ['게시판', '재고관리', '매출금액', '판매량', '입고요청'] },
  { category: '네이버', items: ['게시판', '재고관리', '매출금액', '판매량', '입고요청'] }
];

function Sidebar() {
  return (
    <nav className="sidebar">
      {navData.map((group) => (
        <div key={group.category} className="nav-group">
          <div className="nav-category">{group.category}</div>
          <ul>
            {group.items.map((item) => (
              <li key={item}>
                <Link to="#" className="nav-link">{item}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default Sidebar;
