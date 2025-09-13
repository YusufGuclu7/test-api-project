// frontend/src/DataTable.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, CircularProgress, Typography } from '@mui/material';

const API_URL = 'https://test-api-project-z1ko.onrender.com';

const DataTable = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/reports`);
        setRecords(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Veri çekilemedi');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: 16, overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Hesap Kodu</TableCell>
            <TableCell>Borç</TableCell>
            <TableCell>Alacak</TableCell>
            <TableCell>Şirket Adı</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((rec) => (
            <React.Fragment key={rec.key}>
              <TableRow style={{ backgroundColor: '#f0f0f0' }}>
                <TableCell style={{ fontWeight: 'bold' }}>{rec.key}</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>{rec.debt.toFixed(2)}</TableCell>
                <TableCell style={{ fontWeight: 'bold' }}>{rec.credit.toFixed(2)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              {rec.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell style={{ paddingLeft: '32px' }}>{item.code}</TableCell>
                  <TableCell>{item.rawData.borc || 0}</TableCell>
                  <TableCell>{item.rawData.alacak || 0}</TableCell>
                  <TableCell>{item.rawData.hesap_adi || 'Bilinmiyor'}</TableCell>
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default DataTable;