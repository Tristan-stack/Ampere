"use client"

import { useEffect, useState } from 'react'

export function withClientSideRendering(Component: React.ComponentType<any>) {
  return function WrappedComponent(props: any) {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
      setIsClient(true)
    }, [])

    if (!isClient) {
      return null
    }

    return <Component {...props} />
  }
} 