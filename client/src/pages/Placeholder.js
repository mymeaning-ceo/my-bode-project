import React from 'react';
import { useLocation } from 'react-router-dom';

function Placeholder() {
  const location = useLocation();
  return (
    <div>
      <h2>{location.pathname}</h2>
      <p>준비 중인 페이지입니다.</p>
    </div>
  );
}

export default Placeholder;
