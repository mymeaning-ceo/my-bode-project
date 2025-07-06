import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

class QueryClient {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  async fetchQuery(key, fn) {
    const keyStr = JSON.stringify(key);
    if (!this.cache.has(keyStr)) {
      const data = await fn();
      this.cache.set(keyStr, data);
    }
    return this.cache.get(keyStr);
  }

  setQueryData(key, data) {
    const keyStr = JSON.stringify(key);
    this.cache.set(keyStr, data);
    const ls = this.listeners.get(keyStr);
    if (ls) ls.forEach((cb) => cb(data));
  }

  invalidateQueries({ queryKey }) {
    const keyStr = JSON.stringify(queryKey);
    if (this.cache.has(keyStr)) {
      this.cache.delete(keyStr);
      const ls = this.listeners.get(keyStr);
      if (ls) ls.forEach((cb) => cb(undefined));
    }
  }

  subscribe(key, cb) {
    const keyStr = JSON.stringify(key);
    if (!this.listeners.has(keyStr)) this.listeners.set(keyStr, new Set());
    const set = this.listeners.get(keyStr);
    set.add(cb);
    return () => {
      set.delete(cb);
      if (set.size === 0) this.listeners.delete(keyStr);
    };
  }
}

const QueryClientContext = createContext(null);

function QueryClientProvider({ client, children }) {
  return (
    <QueryClientContext.Provider value={client}>{children}</QueryClientContext.Provider>
  );
}

QueryClientProvider.propTypes = {
  client: PropTypes.instanceOf(QueryClient).isRequired,
  children: PropTypes.node.isRequired,
};

function useQueryClient() {
  return useContext(QueryClientContext);
}

function useQuery({ queryKey, queryFn }) {
  const client = useQueryClient();
  const keyStr = JSON.stringify(queryKey);
  const [data, setData] = useState(() => client.cache.get(keyStr));
  const [isFetching, setFetching] = useState(!client.cache.has(keyStr));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await client.fetchQuery(queryKey, queryFn);
        if (active) {
          setData(result);
          setFetching(false);
        }
      } catch (err) {
        if (active) {
          setError(err);
          setFetching(false);
        }
      }
    };
    if (!client.cache.has(keyStr)) load();
    const unsubscribe = client.subscribe(queryKey, (d) => {
      if (d === undefined) {
        setFetching(true);
        load();
      } else {
        setData(d);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [keyStr, queryFn, client]);

  return { data, isFetching, error };
}

export { QueryClient, QueryClientProvider, useQueryClient, useQuery };
