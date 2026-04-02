import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import TopNavbar from '../components/Navbar';

export default function AppLayout({ children }) {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';

  if (isLogin) return <>{children}</>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNavbar />
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: '64px',
          p: { xs: 2, sm: 3 },
          maxWidth: '100%',
          overflowX: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
