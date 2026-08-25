import React from 'react'
import KnowledgeHubView from './KnowledgeHubView'

interface WelcomeScreenProps {
  workspacePath: string | null
  workspaceName?: string
  onFileSelect?: (filePath: string) => void
  onCreateFileAtRoot?: () => void
  fileIcons?: Record<string, string>
}

function WelcomeScreenComponent({
  workspacePath,
  workspaceName,
  onFileSelect,
  onCreateFileAtRoot,
  fileIcons
}: WelcomeScreenProps): React.JSX.Element {
  return (
    <KnowledgeHubView
      workspacePath={workspacePath}
      workspaceName={workspaceName}
      onFileSelect={onFileSelect || ((): void => {})}
      onCreateFileAtRoot={onCreateFileAtRoot}
      fileIcons={fileIcons}
    />
  )
}

export default React.memo(WelcomeScreenComponent)
