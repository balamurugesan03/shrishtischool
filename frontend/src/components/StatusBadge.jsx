import { Chip } from '@mui/material';

const colorMap = {
  Active:      'success',
  Inactive:    'error',
  Pending:     'warning',
  Paid:        'success',
  Partial:     'warning',
  Overdue:     'error',
  Cancelled:   'default',
  Issued:      'primary',
  Returned:    'success',
  Lost:        'error',
  Transferred: 'info',
  Graduated:   'secondary',
  Terminated:  'error',
  'On Leave':  'warning',
  Completed:   'success',
  Failed:      'error',
};

export default function StatusBadge({ status }) {
  return (
    <Chip
      label={status}
      color={colorMap[status] || 'default'}
      variant="outlined"
      size="small"
      sx={{ fontWeight: 600, fontSize: '11px', height: 22 }}
    />
  );
}
