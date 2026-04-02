import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

export default function PageHeader({ title, subtitle, action, breadcrumbs = [] }) {
  return (
    <Box mb={3}>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }} aria-label="breadcrumb">
          {breadcrumbs.map((b, i) =>
            b.path ? (
              <MuiLink
                key={i}
                component={Link}
                to={b.path}
                underline="hover"
                color="primary"
                variant="caption"
                fontWeight={500}
              >
                {b.label}
              </MuiLink>
            ) : (
              <Typography key={i} variant="caption" color="text.secondary">{b.label}</Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>{title}</Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>
          )}
        </Box>
        {action}
      </Box>
    </Box>
  );
}
