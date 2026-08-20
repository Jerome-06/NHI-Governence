import { useState, useEffect } from "react"
import "./App.css"

function App() {
  const [message, setMessage] = useState("Connecting...")
  const [directoryFile, setDirectoryFile] = useState(null)
  const [activityFile, setActivityFile] = useState(null)
  const [ingestStatus, setIngestStatus] = useState("")
  const [identities, setIdentities] = useState([])
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => setMessage("Error connecting to backend: " + error.message))
  }, [])

  const loadIdentities = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/identities")
      const data = await response.json()
      setIdentities(data.identities)
    } catch (error) {
      console.error("Failed to load identities:", error)
    }
  }

  const handleScan = async () => {
    if (!directoryFile || !activityFile) {
      setIngestStatus("Please select both files before scanning.")
      return
    }

    setIngestStatus("Scanning...")

    const formData = new FormData()
    formData.append("directory_file", directoryFile)
    formData.append("activity_file", activityFile)

    try {
      const response = await fetch("http://127.0.0.1:8000/ingest", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setIngestStatus("Error: " + (data.detail || "Something went wrong."))
        return
      }

      setIngestStatus(
        `Success — ingested ${data.identities_inserted} identities and ${data.activities_inserted} activities.`
      )

      loadIdentities()
      setSelectedDetail(null)
    } catch (error) {
      setIngestStatus("Error: " + error.message)
    }
  }

  const handleSelectIdentity = async (accountId) => {
    setDetailLoading(true)
    setSelectedDetail(null)

    try {
      const response = await fetch(`http://127.0.0.1:8000/identities/${accountId}`)
      const data = await response.json()
      setSelectedDetail(data)
    } catch (error) {
      console.error("Failed to load identity detail:", error)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="app-title">🛡️ NHI Governance Dashboard</h1>
        <div className="status-badge">
          <span className="status-dot"></span>
          {message}
        </div>
      </div>

      <div className="card">
        <h2>Identity Discovery</h2>
        <p className="card-subtitle">Upload directory and activity JSON to scan for identities</p>

        <div className="upload-grid">
          <div className="upload-box">
            <p className="upload-label">directory.json</p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setDirectoryFile(e.target.files[0])}
            />
            {directoryFile && <p className="upload-selected">✓ {directoryFile.name}</p>}
          </div>

          <div className="upload-box">
            <p className="upload-label">activity.json</p>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setActivityFile(e.target.files[0])}
            />
            {activityFile && <p className="upload-selected">✓ {activityFile.name}</p>}
          </div>
        </div>

        <button className="btn-primary" onClick={handleScan}>
          Run Discovery Scan
        </button>

        {ingestStatus && <div className="ingest-status">{ingestStatus}</div>}
      </div>

      {identities.length > 0 && (
        <div className="card">
          <h2>Identity Register</h2>
          <p className="card-subtitle">Click a row to view its risk analysis</p>

          <table className="identity-table">
            <thead>
              <tr>
                <th>Account ID</th>
                <th>Type</th>
                <th>Assigned Agent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {identities.map((identity) => (
                <tr
                  key={identity.account_id}
                  onClick={() => handleSelectIdentity(identity.account_id)}
                  className={selectedDetail?.identity?.account_id === identity.account_id ? "selected-row" : ""}
                >
                  <td className="account-id">{identity.account_id}</td>
                  <td>{identity.type}</td>
                  <td>
                    {identity.agent || <span className="badge-muted">None</span>}
                  </td>
                  <td>
                    {identity.agent === null ? (
                      <span className="badge badge-danger">⚠ Orphan</span>
                    ) : (
                      <span className="badge badge-success">Assigned</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detailLoading && <div className="card">Loading risk analysis...</div>}

      {selectedDetail && (
        <div className="card">
          <h2>Risk Analysis</h2>
          <p className="card-subtitle">
            Selected identity: <code className="account-id">{selectedDetail.identity.account_id}</code>
          </p>

          {selectedDetail.risks.map((risk, index) => (
            <div key={index} className={`alert ${risk.severity === "High" ? "alert-high" : "alert-medium"}`}>
              <p className="alert-title">{risk.risk_type} · {risk.severity}</p>
              <p className="alert-reason">{risk.reason}</p>
            </div>
          ))}

          {selectedDetail.risks.length === 0 && (
            <div className="alert-clean">✅ No risks found for this identity.</div>
          )}

          <p className="section-title">Permissions — Granted vs Used</p>
          <div className="perm-columns">
            <div>
              <p className="perm-col-label">Granted</p>
              {selectedDetail.granted_permissions.map((perm) => {
                const isUsed = selectedDetail.used_permissions.includes(perm)
                return (
                  <div key={perm} className={`perm-pill ${isUsed ? "granted-used" : "granted-unused"}`}>
                    {perm} {!isUsed && "(unused)"}
                  </div>
                )
              })}
            </div>
            <div>
              <p className="perm-col-label">Used (last 30 days)</p>
              {selectedDetail.used_permissions.length > 0 ? (
                selectedDetail.used_permissions.map((perm) => (
                  <div key={perm} className="perm-pill used">{perm}</div>
                ))
              ) : (
                <p className="badge-muted" style={{ fontSize: "12px" }}>— none —</p>
              )}
            </div>
          </div>

          <p className="section-title">Activity Timeline</p>
          {selectedDetail.activity_timeline.length > 0 ? (
            selectedDetail.activity_timeline.map((event, index) => (
              <div key={index} className="timeline-item">
                <span className="timeline-time">{new Date(event.timestamp).toLocaleString()}</span>
                <span>{event.action} <span className="timeline-resource">{event.resource}</span></span>
              </div>
            ))
          ) : (
            <p className="badge-muted" style={{ fontSize: "13px" }}>No activity recorded.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default App