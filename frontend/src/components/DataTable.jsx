import {
  Paper, Box, TextField, InputAdornment, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, CircularProgress, Typography,
  Pagination, Select, MenuItem, FormControl, Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function DataTable({
  columns, data, loading, total, page, limit,
  onPageChange, onLimitChange, onSearch, searchPlaceholder = 'Search...',
  actions
}) {
  const pages = Math.ceil((total || 0) / (limit || 10));

  return (
    <Paper sx={{ overflow: 'hidden', borderRadius: 2 }}>
      {(onSearch || actions) && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
          {onSearch && (
            <TextField
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              size="small"
              sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: 320 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
        </Box>
      )}

      <TableContainer sx={{ overflowX: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress size={32} color="primary" />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} style={{ width: col.width }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((row, i) => (
                  <TableRow
                    key={row._id || i}
                    hover
                    sx={{ '&:last-child td': { border: 0 } }}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '-')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No data found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {total > 0 && (
        <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Rows per page:</Typography>
            <FormControl size="small">
              <Select
                value={limit}
                onChange={(e) => onLimitChange && onLimitChange(Number(e.target.value))}
                sx={{ fontSize: '13px', '& .MuiSelect-select': { py: 0.5, px: 1 } }}
              >
                {[5, 10, 20, 50].map(n => <MenuItem key={n} value={n} sx={{ fontSize: '13px' }}>{n}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
            </Typography>
            <Pagination
              count={pages}
              page={page}
              onChange={(_, p) => onPageChange && onPageChange(p)}
              size="small"
              color="primary"
              shape="rounded"
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}
