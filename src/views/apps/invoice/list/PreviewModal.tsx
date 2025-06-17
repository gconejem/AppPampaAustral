              {/* Observaciones */}
              {cotizacion.observaciones && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Observaciones
                  </Typography>
                  <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                    {cotizacion.observaciones}
                  </Typography>
                </Box>
              )}

              {/* Notas */}
              {cotizacion.notas && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>
                    Notas
                  </Typography>
                  <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                    {cotizacion.notas}
                  </Typography>
                </Box>
              )}

              {/* Totales */} 
