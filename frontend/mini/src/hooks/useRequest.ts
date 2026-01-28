import React, { useState, useCallback, useEffect, useRef } from 'react'

interface UseRequestOptions<T> {
  manual?: boolean
  defaultParams?: any[]
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  refreshDeps?: any[]
}

interface UseRequestResult<T, P extends any[]> {
  data: T | undefined
  loading: boolean
  error: Error | undefined
  run: (...params: P) => Promise<T | undefined>
  refresh: () => Promise<T | undefined>
  mutate: (data: T | ((prev: T | undefined) => T)) => void
}

/**
 * 请求Hook
 */
export function useRequest<T, P extends any[] = any[]>(
  service: (...params: P) => Promise<T>,
  options: UseRequestOptions<T> = {}
): UseRequestResult<T, P> {
  const { manual = false, defaultParams = [], onSuccess, onError, refreshDeps = [] } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(!manual)
  const [error, setError] = useState<Error | undefined>(undefined)

  const paramsRef = useRef<P>(defaultParams as P)
  const mountedRef = useRef(true)

  const run = useCallback(
    async (...params: P) => {
      paramsRef.current = params
      setLoading(true)
      setError(undefined)

      try {
        const result = await service(...params)
        if (mountedRef.current) {
          setData(result)
          onSuccess?.(result)
        }
        return result
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err)
          onError?.(err)
        }
        return undefined
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [service, onSuccess, onError]
  )

  const refresh = useCallback(() => {
    return run(...paramsRef.current)
  }, [run])

  const mutate = useCallback((newData: T | ((prev: T | undefined) => T)) => {
    if (typeof newData === 'function') {
      setData((prev) => (newData as (prev: T | undefined) => T)(prev))
    } else {
      setData(newData)
    }
  }, [])

  // 自动执行
  useEffect(() => {
    if (!manual) {
      run(...(defaultParams as P))
    }
  }, [manual, ...refreshDeps])

  // 组件卸载标记
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  return { data, loading, error, run, refresh, mutate }
}

/**
 * 分页请求Hook
 */
interface UsePaginationOptions<T> extends Omit<UseRequestOptions<T>, 'defaultParams'> {
  defaultPageSize?: number
}

interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export function usePagination<T>(
  service: (params: { page: number; page_size: number; [key: string]: any }) => Promise<PaginatedResult<T>>,
  options: UsePaginationOptions<PaginatedResult<T>> = {}
) {
  const { defaultPageSize = 20, ...restOptions } = options

  const [page, setPage] = useState(1)
  const [pageSize] = useState(defaultPageSize)
  const [list, setList] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const request = useRequest(service, {
    ...restOptions,
    manual: true,
    onSuccess: (data) => {
      if (page === 1) {
        setList(data.items)
      } else {
        setList((prev) => [...prev, ...data.items])
      }
      setTotal(data.total)
      setHasMore(data.page < data.total_pages)
      restOptions.onSuccess?.(data)
    },
  })

  const run = useCallback(
    (params?: Record<string, any>) => {
      setPage(1)
      return request.run({ page: 1, page_size: pageSize, ...params })
    },
    [pageSize, request]
  )

  const loadMore = useCallback(
    (params?: Record<string, any>) => {
      if (request.loading || !hasMore) return
      const nextPage = page + 1
      setPage(nextPage)
      return request.run({ page: nextPage, page_size: pageSize, ...params })
    },
    [page, pageSize, hasMore, request]
  )

  const refresh = useCallback(
    (params?: Record<string, any>) => {
      return run(params)
    },
    [run]
  )

  return {
    list,
    total,
    page,
    pageSize,
    hasMore,
    loading: request.loading,
    error: request.error,
    run,
    loadMore,
    refresh,
  }
}
