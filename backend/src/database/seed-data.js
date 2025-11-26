import dgraphClient from '../config/database.js';
import logger from '../config/logger.js';

async function seedData() {
  try {
    logger.info('Seeding database with sample data...');

    // Sample users
    const users = [
      {
        'dgraph.type': 'User',
        name: 'Alice Johnson',
        email: 'alice.johnson@company.com',
        role: 'incident_commander',
        department: 'Security Operations',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        'dgraph.type': 'User',
        name: 'Bob Smith',
        email: 'bob.smith@company.com',
        role: 'analyst',
        department: 'Threat Intelligence',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        'dgraph.type': 'User',
        name: 'Carol Williams',
        email: 'carol.williams@company.com',
        role: 'technical_lead',
        department: 'Infrastructure Security',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        'dgraph.type': 'User',
        name: 'David Brown',
        email: 'david.brown@company.com',
        role: 'analyst',
        department: 'Security Operations',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Create users
    const txn1 = dgraphClient.newTxn();
    try {
      const userResponse = await txn1.mutate({ setJson: users });
      await txn1.commit();
      logger.info('Users created:', userResponse.data.uids);

      const userUids = Object.values(userResponse.data.uids);

      // Sample playbook templates
      const playbooks = [
        {
          'dgraph.type': 'PlaybookTemplate',
          name: 'Ransomware Response',
          description: 'Complete playbook for handling ransomware incidents',
          estimated_duration: '4-8 hours',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          'dgraph.type': 'PlaybookTemplate',
          name: 'Phishing Investigation',
          description: 'Standard procedure for investigating phishing campaigns',
          estimated_duration: '2-4 hours',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          'dgraph.type': 'PlaybookTemplate',
          name: 'Data Exfiltration Response',
          description: 'Playbook for responding to unauthorized data access and exfiltration',
          estimated_duration: '6-12 hours',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const txn2 = dgraphClient.newTxn();
      try {
        const playbookResponse = await txn2.mutate({ setJson: playbooks });
        await txn2.commit();
        logger.info('Playbooks created:', playbookResponse.data.uids);

        const playbookUids = Object.values(playbookResponse.data.uids);

        // Sample incidents with artifacts
        const incidents = [
          {
            'dgraph.type': 'Incident',
            title: 'Suspected Ransomware on File Server',
            description: 'Multiple files encrypted on FS-01 file server. Ransom note detected.',
            severity: 'High',
            tlp: 'Red',
            status: 'InProgress',
            assigned_to: { uid: userUids[0] },
            playbook: { uid: playbookUids[0] },
            files: [],
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            references: [
              {
                'dgraph.type': 'Reference',
                title: 'Internal Ticket TICKET-2024-001',
                link: 'https://helpdesk.company.com/tickets/2024-001',
                created_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Reference',
                title: 'Email Alert EMAIL-ALERT-456',
                link: 'https://mail.company.com/alerts/456',
                created_at: new Date().toISOString()
              }
            ],
            artifacts: [
              {
                'dgraph.type': 'Artifact',
                value: '192.168.1.105',
                artifact_type: 'ip',
                status: 'malicious',
                kind: 'ioc',
                notes: 'C2 server communication detected',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Artifact',
                value: 'malicious-domain.evil',
                artifact_type: 'domain',
                status: 'malicious',
                kind: 'ioc',
                notes: 'Used for payload download',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Artifact',
                value: 'a3d5f6e7c8b9a1d2e3f4g5h6i7j8k9l0',
                artifact_type: 'hash',
                status: 'malicious',
                kind: 'ioc',
                notes: 'SHA256 hash of ransomware executable',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          },
          {
            'dgraph.type': 'Incident',
            title: 'Phishing Campaign Targeting HR Department',
            description: 'Multiple HR employees received suspicious emails claiming to be from payroll system.',
            severity: 'Medium',
            tlp: 'Amber',
            status: 'Open',
            assigned_to: { uid: userUids[1] },
            playbook: { uid: playbookUids[1] },
            files: [],
            created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            references: [
              {
                'dgraph.type': 'Reference',
                title: 'Ticketing System - TICKET-2024-002',
                link: 'https://helpdesk.company.com/tickets/2024-002',
                created_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Reference',
                title: 'MITRE ATT&CK - Phishing Technique',
                link: 'https://attack.mitre.org/techniques/T1566/',
                created_at: new Date().toISOString()
              }
            ],
            artifacts: [
              {
                'dgraph.type': 'Artifact',
                value: 'http://payroll-update-verify.com/login',
                artifact_type: 'url',
                status: 'malicious',
                kind: 'ioc',
                notes: 'Credential harvesting page',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Artifact',
                value: 'sender@fake-company.com',
                artifact_type: 'domain',
                status: 'malicious',
                kind: 'ioc',
                notes: 'Spoofed sender domain',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          },
          {
            'dgraph.type': 'Incident',
            title: 'Unusual Data Access Pattern Detected',
            description: 'Employee account accessed sensitive customer database outside normal hours.',
            severity: 'High',
            tlp: 'Amber',
            status: 'Open',
            assigned_to: { uid: userUids[2] },
            files: [],
            created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            references: [
              {
                'dgraph.type': 'Reference',
                title: 'SIEM Alert - SIEM-ALERT-789',
                link: 'https://siem.company.com/alerts/789',
                created_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Reference',
                title: 'Data Access Policy Documentation',
                link: 'https://docs.company.com/security/data-access-policy',
                created_at: new Date().toISOString()
              }
            ],
            artifacts: [
              {
                'dgraph.type': 'Artifact',
                value: 'DB-SERVER-01',
                artifact_type: 'ip',
                status: 'clean',
                kind: 'asset',
                notes: 'Customer database server',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Artifact',
                value: '10.0.5.45',
                artifact_type: 'ip',
                status: 'unknown',
                kind: 'ioc',
                notes: 'Source IP for unusual access',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          },
          {
            'dgraph.type': 'Incident',
            title: 'Malware Detected on Workstation',
            description: 'Antivirus detected and quarantined malware on employee workstation.',
            severity: 'Low',
            tlp: 'Green',
            status: 'Resolved',
            assigned_to: { uid: userUids[3] },
            files: [],
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            closed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            references: [
              {
                'dgraph.type': 'Reference',
                title: 'Antivirus Alert - AV-ALERT-2024-123',
                link: 'https://av.company.com/alerts/2024-123',
                created_at: new Date().toISOString()
              },
              {
                'dgraph.type': 'Reference',
                title: 'VirusTotal Analysis',
                link: 'https://virustotal.com/analysis/sample123',
                created_at: new Date().toISOString()
              }
            ],
            artifacts: [
              {
                'dgraph.type': 'Artifact',
                value: 'b4e6a7f8c9d0e1f2g3h4i5j6k7l8m9n0',
                artifact_type: 'hash',
                status: 'malicious',
                kind: 'ioc',
                notes: 'Known trojan variant',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          }
        ];

        const txn3 = dgraphClient.newTxn();
        try {
          const incidentResponse = await txn3.mutate({ setJson: incidents });
          await txn3.commit();
          logger.info('Incidents and artifacts created:', incidentResponse.data.uids);

          logger.info('✅ Database seeded successfully!');
          return true;
        } catch (error) {
          await txn3.discard();
          throw error;
        }
      } catch (error) {
        await txn2.discard();
        throw error;
      }
    } catch (error) {
      await txn1.discard();
      throw error;
    }
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData()
    .then(() => {
      logger.info('Database seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Failed to seed database:', error);
      process.exit(1);
    });
}

export default seedData;
