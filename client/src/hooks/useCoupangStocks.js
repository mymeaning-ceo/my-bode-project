import { useQuery } from '@tanstack/react-query';

const pageSize = 50;

async function fetchCoupangStocks({ page, keyword, brand, sort, order }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(pageSize),
    keyword,
    brand,
    sort,
    order,
  });
  const res = await fetch(`/api/coupang?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Failed to load');
  }
  return res.json();
}

export default function useCoupangStocks(params) {
  return useQuery({
    queryKey: ['coupangStock', params],
    queryFn: () => fetchCoupangStocks(params),
    keepPreviousData: true,
  });
}
