export const runtime = 'edge';

import { HomeLayout } from '@/features/home/ui/layouts/home-layout';

const Home = () => {
    return (
        <div className="no-scrollbar w-full flex-1">
            <HomeLayout />
        </div>
    );
};

export default Home;
