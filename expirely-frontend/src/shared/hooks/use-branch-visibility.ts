// Stub — branches not needed for Expirely
export function useBranchVisibility() {
  return {
    branches: [],
    showBranch: false,
    defaultBranchId: '',
    branchNameById: new Map<string, string>(),
    loading: false,
    error: null,
  };
}
