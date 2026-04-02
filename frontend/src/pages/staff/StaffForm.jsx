import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paper, Grid, TextField, Button, Box, Tabs, Tab, MenuItem } from '@mui/material';
import { useSnackbar } from 'notistack';
import { IconUser, IconBuildingBank } from '@tabler/icons-react';
import PageHeader from '../../components/PageHeader';
import { staffAPI } from '../../services/api';

const DEPARTMENTS = ['Administration','Teaching','Science','Mathematics','Arts','Sports','IT','Library','Accounts'];
const ROLES = ['Principal','Vice Principal','Teacher','Head of Department','Lab Assistant','Librarian','Accountant','Clerk','Security','Driver'];

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const INIT = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '',
  gender: '', department: '', role: '', designation: '', joiningDate: new Date().toISOString().split('T')[0],
  salary: 0, qualification: '', experience: 0, status: 'Active',
  address: { street: '', city: '', state: '', pincode: '' },
  bankDetails: { accountNumber: '', bankName: '', ifscCode: '', accountHolderName: '' }
};

export default function StaffForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [values, setValues] = useState(INIT);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(id);

  const set = (field) => (e) => setValues(prev => ({ ...prev, [field]: e.target.value }));
  const setNested = (parent, field) => (e) =>
    setValues(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: e.target.value } }));

  useEffect(() => {
    if (isEdit) {
      staffAPI.getById(id).then(res => {
        const s = res.data;
        setValues({
          ...INIT, ...s,
          dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
          joiningDate: s.joiningDate ? s.joiningDate.split('T')[0] : INIT.joiningDate,
          bankDetails: { ...INIT.bankDetails, ...(s.bankDetails || {}) },
        });
      });
    }
  }, [id]);

  const validate = () => {
    const e = {};
    if (!values.firstName)  e.firstName  = 'Required';
    if (!values.lastName)   e.lastName   = 'Required';
    if (!values.department) e.department = 'Required';
    if (!values.role)       e.role       = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await staffAPI.update(id, values);
        enqueueSnackbar('Staff updated', { variant: 'success' });
      } else {
        await staffAPI.create(values);
        enqueueSnackbar('Staff added', { variant: 'success' });
      }
      navigate('/staff');
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tf = (label, field, extra = {}) => (
    <TextField label={label} size="small" fullWidth
      value={values[field]} onChange={set(field)}
      error={!!errors[field]} helperText={errors[field]} {...extra} />
  );

  const ntf = (label, parent, field, extra = {}) => (
    <TextField label={label} size="small" fullWidth
      value={values[parent][field]} onChange={setNested(parent, field)} {...extra} />
  );

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Staff' : 'Add Staff'}
        breadcrumbs={[{ label: 'Staff', path: '/staff' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<IconUser size={14} />} iconPosition="start" label="Basic Info" />
            <Tab icon={<IconBuildingBank size={14} />} iconPosition="start" label="Bank Details" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>{tf('First Name', 'firstName', { required: true })}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Last Name', 'lastName', { required: true })}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Email', 'email')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Phone', 'phone')}</Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField label="Date of Birth" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={values.dateOfBirth} onChange={set('dateOfBirth')} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Gender" size="small" fullWidth value={values.gender} onChange={set('gender')}>
                  {['Male','Female','Other'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Department" size="small" fullWidth required value={values.department}
                  onChange={set('department')} error={!!errors.department} helperText={errors.department}>
                  {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Role" size="small" fullWidth required value={values.role}
                  onChange={set('role')} error={!!errors.role} helperText={errors.role}>
                  {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Designation', 'designation')}</Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField label="Joining Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                  value={values.joiningDate} onChange={set('joiningDate')} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField label="Salary (₹)" type="number" size="small" fullWidth
                  value={values.salary} onChange={set('salary')} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField label="Experience (Years)" type="number" size="small" fullWidth
                  value={values.experience} onChange={set('experience')} inputProps={{ min: 0 }} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Qualification', 'qualification')}</Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Status" size="small" fullWidth value={values.status} onChange={set('status')}>
                  {['Active','Inactive','On Leave','Terminated'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>{ntf('Account Number', 'bankDetails', 'accountNumber')}</Grid>
              <Grid item xs={12} sm={6}>{ntf('Bank Name', 'bankDetails', 'bankName')}</Grid>
              <Grid item xs={12} sm={6}>{ntf('IFSC Code', 'bankDetails', 'ifscCode')}</Grid>
              <Grid item xs={12} sm={6}>{ntf('Account Holder Name', 'bankDetails', 'accountHolderName')}</Grid>
            </Grid>
          </TabPanel>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button variant="text" onClick={() => navigate('/staff')} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Staff' : 'Add Staff')}
            </Button>
          </Box>
        </form>
      </Paper>
    </>
  );
}
