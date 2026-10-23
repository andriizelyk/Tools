import { Suspense } from 'react';
import { LinearProgress } from '@mui/material';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import { tools } from './tools/registry';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        {tools.map(({ path, component: Component }) => (
          <Route key={path} path={path} element={
              <Suspense fallback={<LinearProgress />}>
                <Component />
              </Suspense>
            } />
        ))}
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}
