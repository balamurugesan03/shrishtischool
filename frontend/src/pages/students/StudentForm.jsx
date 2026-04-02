import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper, Grid, TextField, Button, Box, Tabs, Tab, MenuItem,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { IconUser, IconUsers, IconHome } from '@tabler/icons-react';
import PageHeader from '../../components/PageHeader';
import { studentAPI } from '../../services/api';

const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTIONS = ['A','B','C','D','E'];

function TabPanel({ children, value, index }) {
  return value === index ? <Box pt={2}>{children}</Box> : null;
}

const INIT = {
  firstName: '', lastName: '', dateOfBirth: '', gender: '',
  email: '', phone: '', class: '', section: '', rollNumber: '',
  status: 'Active', bloodGroup: '', religion: '', category: '',
  academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  address: { street: '', city: '', state: '', pincode: '' },
  parentDetails: {
    fatherName: '', fatherPhone: '', fatherOccupation: '',
    motherName: '', motherPhone: '', motherOccupation: '',
    guardianName: '', guardianPhone: '', relationship: ''
  }
};

export default function StudentForm() {
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
      studentAPI.getById(id).then(res => {
        const s = res.data;
        setValues({
          ...INIT, ...s,
          dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
          address: { ...INIT.address, ...(s.address || {}) },
          parentDetails: { ...INIT.parentDetails, ...(s.parentDetails || {}) },
        });
      }).catch(() => enqueueSnackbar('Failed to load student', { variant: 'error' }));
    }
  }, [id]);

  const validate = () => {
    const e = {};
    if (!values.firstName) e.firstName = 'Required';
    if (!values.lastName)  e.lastName  = 'Required';
    if (!values.class)     e.class     = 'Required';
    if (!values.section)   e.section   = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...values, dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth) : null };
      if (isEdit) {
        await studentAPI.update(id, payload);
        enqueueSnackbar('Student updated successfully', { variant: 'success' });
      } else {
        await studentAPI.create(payload);
        enqueueSnackbar('Student added successfully', { variant: 'success' });
      }
      navigate('/students');
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const tf = (label, field, required, extra) => (
    <TextField
      label={label} size="small" fullWidth required={required}
      value={values[field]} onChange={set(field)}
      error={!!errors[field]} helperText={errors[field]}
      {...extra}
    />
  );

  const ntf = (label, parent, field) => (
    <TextField
      label={label} size="small" fullWidth
      value={values[parent][field]} onChange={setNested(parent, field)}
    />
  );

  return (
    <>
      <PageHeader
        title={isEdit ? 'Edit Student' : 'Add Student'}
        breadcrumbs={[{ label: 'Students', path: '/students' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tab icon={<IconUser size={14} />} iconPosition="start" label="Basic Info" />
            <Tab icon={<IconUsers size={14} />} iconPosition="start" label="Parent Details" />
            <Tab icon={<IconHome size={14} />} iconPosition="start" label="Address" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>{tf('First Name', 'firstName', true)}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Last Name', 'lastName', true)}</Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField label="Date of Birth" type="date" size="small" fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={values.dateOfBirth} onChange={set('dateOfBirth')} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Gender" size="small" fullWidth value={values.gender} onChange={set('gender')}>
                  {['Male','Female','Other'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Email', 'email', false)}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Phone', 'phone', false)}</Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Class" size="small" fullWidth required
                  value={values.class} onChange={set('class')} error={!!errors.class} helperText={errors.class}>
                  {CLASSES.map(c => <MenuItem key={c} value={c}>Class {c}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Section" size="small" fullWidth required
                  value={values.section} onChange={set('section')} error={!!errors.section} helperText={errors.section}>
                  {SECTIONS.map(s => <MenuItem key={s} value={s}>Section {s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Roll Number', 'rollNumber', false)}</Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Status" size="small" fullWidth value={values.status} onChange={set('status')}>
                  {['Active','Inactive','Transferred','Graduated'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Blood Group" size="small" fullWidth value={values.bloodGroup} onChange={set('bloodGroup')}>
                  <MenuItem value="">Select</MenuItem>
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <MenuItem key={b} value={b}>{b}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Academic Year', 'academicYear', false)}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Religion', 'religion', false)}</Grid>
              <Grid item xs={12} sm={6} md={4}>{tf('Category', 'category', false)}</Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>{ntf("Father's Name", 'parentDetails', 'fatherName')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf("Father's Phone", 'parentDetails', 'fatherPhone')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf("Father's Occupation", 'parentDetails', 'fatherOccupation')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf("Mother's Name", 'parentDetails', 'motherName')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf("Mother's Phone", 'parentDetails', 'motherPhone')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf("Mother's Occupation", 'parentDetails', 'motherOccupation')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf('Guardian Name', 'parentDetails', 'guardianName')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf('Guardian Phone', 'parentDetails', 'guardianPhone')}</Grid>
              <Grid item xs={12} sm={6} md={4}>{ntf('Relationship', 'parentDetails', 'relationship')}</Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>{ntf('Street', 'address', 'street')}</Grid>
              <Grid item xs={12} sm={6}>{ntf('City', 'address', 'city')}</Grid>
              <Grid item xs={12} sm={6}>{ntf('State', 'address', 'state')}</Grid>
              <Grid item xs={12} sm={6}>{ntf('Pincode', 'address', 'pincode')}</Grid>
            </Grid>
          </TabPanel>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
            <Button variant="text" onClick={() => navigate('/students')} disabled={loading}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Student' : 'Add Student')}
            </Button>
          </Box>
        </form>
      </Paper>
    </>
  );
}
