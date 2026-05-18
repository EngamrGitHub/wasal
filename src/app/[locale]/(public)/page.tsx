import Home from '@/src/features/(public)/home/home'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams;
    const search = typeof params.search === 'string' ? params.search : '';

    return (
        <div>
            <Home search={search} />
        </div>
    )
}